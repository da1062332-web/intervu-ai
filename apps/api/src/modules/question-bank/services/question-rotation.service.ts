import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionReservationService } from "./question-reservation.service";
import { QuestionStatus, Prisma } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import {
  AssemblyProviderRequest,
  AssemblyProviderResponse,
  QuestionAvailabilityResponse,
  QuestionAvailabilityDetails,
} from "@intervu-ai/contracts";

@Injectable()
export class QuestionRotationService {
  private readonly logger = new Logger(QuestionRotationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reservationService: QuestionReservationService,
  ) {}

  /**
   * Helper to validate the blueprint request parameters.
   */
  validateRequest(request: AssemblyProviderRequest): void {
    const { count, difficultyDistribution } = request;
    const easy = difficultyDistribution.EASY ?? 0;
    const medium = difficultyDistribution.MEDIUM ?? 0;
    const hard = difficultyDistribution.HARD ?? 0;

    if (easy + medium + hard !== count) {
      throw new BadRequestException(
        `The sum of difficulty distribution counts (${easy + medium + hard}) does not match the requested total question count (${count}).`,
      );
    }
  }

  /**
   * Checks the pool availability for a blueprint.
   */
  async checkAvailability(
    request: AssemblyProviderRequest,
  ): Promise<QuestionAvailabilityResponse> {
    this.validateRequest(request);

    // Run throttled lazy cleanup of expired reservations first
    await this.reservationService.throttledCleanup();

    const { sectionId, difficultyDistribution, topicIds } = request;
    const details: QuestionAvailabilityDetails[] = [];
    let totalAvailable = 0;
    let totalMissing = 0;

    const difficulties: ("EASY" | "MEDIUM" | "HARD")[] = [
      "EASY",
      "MEDIUM",
      "HARD",
    ];

    for (const diff of difficulties) {
      const required = difficultyDistribution[diff] ?? 0;
      if (required === 0) {
        details.push({
          difficulty: diff,
          required: 0,
          available: 0,
          missing: 0,
        });
        continue;
      }

      // Query active, non-reserved questions for this difficulty
      const availableCount = await this.prisma.question.count({
        where: {
          status: QuestionStatus.ACTIVE,
          sectionId,
          difficulty: diff,
          topicId:
            topicIds && topicIds.length > 0 ? { in: topicIds } : undefined,
          reservations: {
            none: {
              expiresAt: {
                gt: new Date(),
              },
            },
          },
        },
      });

      const missing = Math.max(0, required - availableCount);
      details.push({
        difficulty: diff,
        required,
        available: availableCount,
        missing,
      });

      totalAvailable += Math.min(required, availableCount);
      totalMissing += missing;
    }

    const status = totalMissing > 0 ? "INSUFFICIENT_POOL" : "AVAILABLE";

    return {
      status,
      required: request.count,
      available: totalAvailable,
      missing: totalMissing,
      details,
    };
  }

  /**
   * Retrieves questions according to blueprint, locks them concurrently, and writes reservations.
   */
  async retrieveAndReserve(
    request: AssemblyProviderRequest,
  ): Promise<AssemblyProviderResponse> {
    this.validateRequest(request);

    // Check availability first. If pool is insufficient, throw exception.
    const availability = await this.checkAvailability(request);
    if (availability.status === "INSUFFICIENT_POOL") {
      throw new BadRequestException({
        message: "Insufficient question pool to satisfy the blueprint.",
        details: availability.details,
      });
    }

    const { sectionId, difficultyDistribution, topicIds } = request;
    const assemblyId = createId();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Run the reservation lock inside a single interactive transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Run lazy cleanup inside transaction
      await this.reservationService.cleanupExpiredReservations(tx);

      const selectedQuestionIds: string[] = [];

      const topicFilter =
        topicIds && topicIds.length > 0
          ? Prisma.sql`AND q.topic_id IN (${Prisma.join(topicIds)})`
          : Prisma.empty;

      // 2. Select and lock questions for each difficulty tier using FOR UPDATE SKIP LOCKED
      for (const [diff, required] of Object.entries(difficultyDistribution)) {
        if (!required || required === 0) continue;

        // Perform raw PostgreSQL query with SKIP LOCKED
        const lockedQuestions: { id: string }[] = await tx.$queryRaw`
          SELECT q.id FROM questions q
          WHERE q.status = 'ACTIVE'::"QuestionStatus"
            AND q.section_id = ${sectionId}
            AND q.difficulty = ${diff}
            ${topicFilter}
            AND q.id NOT IN (
              SELECT qr.question_id FROM question_reservations qr WHERE qr.expires_at > NOW()
            )
          ORDER BY q.times_used ASC, q.last_used ASC NULLS FIRST, q.created_at ASC, RANDOM()
          LIMIT ${required}
          FOR UPDATE SKIP LOCKED;
        `;

        if (lockedQuestions.length < required) {
          throw new BadRequestException({
            message: `Concurrency conflict or pool exhaustion: could not reserve ${required} ${diff} questions.`,
            required,
            available: lockedQuestions.length,
          });
        }

        selectedQuestionIds.push(...lockedQuestions.map((q) => q.id));
      }

      // 3. Retrieve question objects for the response
      const questions = await tx.question.findMany({
        where: {
          id: {
            in: selectedQuestionIds,
          },
        },
      });

      // 4. Create reservations in database
      const reservationIds = await this.reservationService.reserveQuestions(
        tx,
        selectedQuestionIds,
        assemblyId,
        expiresAt,
      );

      // Map back to response interface
      const providerQuestions = questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: q.difficulty as "EASY" | "MEDIUM" | "HARD",
        topicId: q.topicId,
        sectionId: q.sectionId,
      }));

      return {
        questions: providerQuestions,
        reservationIds,
        assemblyId,
        expiresAt: expiresAt.toISOString(),
      };
    });
  }

  /**
   * Aggregates pool health metrics.
   */
  async getPoolHealth(): Promise<Record<string, unknown>> {
    // Run lazy cleanup first
    await this.reservationService.throttledCleanup();

    const now = new Date();

    // 1. Core counters
    const totalActiveQuestions = await this.prisma.question.count({
      where: { status: QuestionStatus.ACTIVE },
    });

    const reservedQuestions = await this.prisma.questionReservation.count({
      where: { expiresAt: { gt: now } },
    });

    const expiredReservations = await this.prisma.questionReservation.count({
      where: { expiresAt: { lte: now } },
    });

    const neverUsedQuestions = await this.prisma.question.count({
      where: {
        status: QuestionStatus.ACTIVE,
        OR: [{ timesUsed: 0 }, { usage: null }],
      },
    });

    // Recently used: usage in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentlyUsedQuestions = await this.prisma.question.count({
      where: {
        status: QuestionStatus.ACTIVE,
        lastUsed: { gte: oneDayAgo },
      },
    });

    // Overused questions: timesUsed > 5
    const overusedQuestions = await this.prisma.question.count({
      where: {
        status: QuestionStatus.ACTIVE,
        timesUsed: { gt: 5 },
      },
    });

    // 2. Coverage by difficulty
    const difficulties = ["EASY", "MEDIUM", "HARD"];
    const coverageByDifficulty: Record<string, number> = {};
    for (const diff of difficulties) {
      coverageByDifficulty[diff] = await this.prisma.question.count({
        where: {
          status: QuestionStatus.ACTIVE,
          difficulty: diff,
        },
      });
    }

    // 3. Coverage by topic
    const topicCounts = await this.prisma.question.groupBy({
      by: ["topicId"],
      where: { status: QuestionStatus.ACTIVE },
      _count: {
        id: true,
      },
    });

    const coverageByTopic: Record<string, number> = {};
    for (const tc of topicCounts) {
      coverageByTopic[tc.topicId] = tc._count.id;
    }

    return {
      totalActiveQuestions,
      reservedQuestions,
      expiredReservations,
      neverUsedQuestions,
      recentlyUsedQuestions,
      overusedQuestions,
      coverageByDifficulty,
      coverageByTopic,
    };
  }
}
