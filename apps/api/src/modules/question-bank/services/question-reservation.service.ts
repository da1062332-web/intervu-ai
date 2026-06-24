import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { createId } from "@paralleldrive/cuid2";
import { Prisma } from "@prisma/client";

@Injectable()
export class QuestionReservationService {
  private readonly logger = new Logger(QuestionReservationService.name);
  private lastCleanupTime = 0;
  private readonly CLEANUP_THROTTLE_MS = 60000; // 60 seconds

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Performs a throttled lazy cleanup of expired reservations.
   */
  async throttledCleanup(tx?: Prisma.TransactionClient): Promise<number> {
    const now = Date.now();
    if (now - this.lastCleanupTime < this.CLEANUP_THROTTLE_MS) {
      return 0;
    }
    this.lastCleanupTime = now;
    return this.cleanupExpiredReservations(tx);
  }

  /**
   * Explicitly clean up all expired reservations from the database.
   */
  async cleanupExpiredReservations(
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;
    const now = new Date();
    const result = await client.questionReservation.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
    if (result.count > 0) {
      this.logger.log(
        `Cleaned up ${result.count} expired question reservations.`,
      );
    }
    return result.count;
  }

  /**
   * Explicitly release reservations for a given assemblyId.
   */
  async releaseReservations(
    assemblyId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const client = tx || this.prisma;
    const result = await client.questionReservation.deleteMany({
      where: {
        assemblyId,
      },
    });
    this.logger.log(
      `Released ${result.count} reservations for assembly ID: ${assemblyId}`,
    );
    return result.count;
  }

  /**
   * Reserves a list of question IDs under a specific assemblyId.
   * Runs in the provided transaction client.
   */
  async reserveQuestions(
    tx: Prisma.TransactionClient,
    questionIds: string[],
    assemblyId: string,
    expiresAt: Date,
  ): Promise<string[]> {
    if (questionIds.length === 0) {
      return [];
    }

    const reservationIds = questionIds.map(() => createId());

    const data = questionIds.map((questionId, index) => ({
      id: reservationIds[index],
      questionId,
      assemblyId,
      expiresAt,
    }));

    await tx.questionReservation.createMany({
      data,
    });

    return reservationIds;
  }
}
