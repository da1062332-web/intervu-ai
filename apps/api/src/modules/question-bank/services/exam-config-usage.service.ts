import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionStatus } from "@prisma/client";
import { AppLogger } from "@intervu-ai/shared-logger";
import { TransactionalOutboxService } from "./transactional-outbox.service";

@Injectable()
export class ExamConfigUsageService {
  private readonly logger = new AppLogger({ name: "ExamConfigUsageService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxService: TransactionalOutboxService,
  ) {}

  /**
   * Records question usage for an Exam Config.
   * Increments timesUsed if already recorded, or creates a new ExamConfigQuestionUsage entry.
   */
  async recordQuestionUsage(
    configId: string,
    questionIds: string[],
    tx?: any,
  ): Promise<void> {
    if (questionIds.length === 0) return;
    const client = tx || this.prisma;

    for (const qId of questionIds) {
      await client.examConfigQuestionUsage.upsert({
        where: {
          configId_questionId: {
            configId,
            questionId: qId,
          },
        },
        create: {
          configId,
          questionId: qId,
          timesUsed: 1,
          lastUsedAt: new Date(),
        },
        update: {
          timesUsed: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });
    }

    await this.outboxService.recordEvent(
      {
        aggregateType: "ExamConfig",
        aggregateId: configId,
        eventType: "questions.allocated",
        payload: {
          configId,
          allocatedQuestionCount: questionIds.length,
          questionIds,
        },
      },
      client,
    );

    this.logger.debug(
      `Recorded ${questionIds.length} question allocations for config ${configId}`,
    );
  }

  /**
   * Calculates unused question capacity for a topic and difficulty for a specific Exam Config.
   */
  async getUnusedPoolCount(
    configId: string,
    topicId: string,
    difficulty?: string,
  ): Promise<number> {
    // Topic UUID vs Code matching
    let topicIdsToMatch = [topicId];
    if (topicId) {
      const topicObj = await this.prisma.topic.findFirst({
        where: { OR: [{ code: topicId }, { id: topicId }] },
      });
      if (topicObj) {
        topicIdsToMatch = Array.from(new Set([topicId, topicObj.id, topicObj.code]));
      }
    }

    // Query active pool questions for topic NOT used by OTHER configs
    const unusedCount = await this.prisma.question.count({
      where: {
        topicId: { in: topicIdsToMatch },
        difficulty: difficulty || undefined,
        status: QuestionStatus.ACTIVE,
        configUsages: {
          none: {
            configId: {
              not: configId,
            },
          },
        },
      },
    });

    return unusedCount;
  }

  /**
   * Finds conflicting config names if questions for this topic were used by another config.
   */
  async findConflictingConfigsForTopic(
    currentConfigId: string,
    topicId: string,
  ): Promise<string[]> {
    let topicIdsToMatch = [topicId];
    if (topicId) {
      const topicObj = await this.prisma.topic.findFirst({
        where: { OR: [{ code: topicId }, { id: topicId }] },
      });
      if (topicObj) {
        topicIdsToMatch = Array.from(new Set([topicId, topicObj.id, topicObj.code]));
      }
    }

    const usages = await this.prisma.examConfigQuestionUsage.findMany({
      where: {
        configId: { not: currentConfigId },
        question: {
          topicId: { in: topicIdsToMatch },
          status: QuestionStatus.ACTIVE,
        },
      },
      select: {
        examConfig: {
          select: { name: true },
        },
      },
      take: 5,
    });

    const names: string[] = Array.from(new Set(usages.map((u: any) => u.examConfig.name)));
    return names;
  }
}
