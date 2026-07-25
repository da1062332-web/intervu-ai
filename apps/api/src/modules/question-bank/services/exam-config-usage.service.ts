import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionStatus, Prisma } from "@prisma/client";
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
   * Calculates unused question capacity for a topic and difficulty for a specific Exam Config,
   * proactively subtracting questions allocated to or claimed by OTHER active configs.
   */
  async getUnusedPoolCount(
    configId: string,
    topicId: string,
    difficulty?: string,
  ): Promise<number> {
    // Topic UUID vs Code matching
    let topicIdsToMatch = [topicId];
    let conceptIdsToMatch: string[] = [];

    if (topicId) {
      const topicObj = await this.prisma.topic.findFirst({
        where: { OR: [{ code: topicId }, { id: topicId }] },
        include: { concepts: true },
      });
      if (topicObj) {
        topicIdsToMatch = Array.from(new Set([topicId, topicObj.id, topicObj.code]));
        conceptIdsToMatch = topicObj.concepts.map((c) => c.id);
      }
    }

    const questionMatchFilter: Prisma.QuestionWhereInput = {
      status: QuestionStatus.ACTIVE,
      difficulty: difficulty || undefined,
      OR: [
        { topicId: { in: topicIdsToMatch } },
        ...(conceptIdsToMatch.length > 0 ? [{ conceptId: { in: conceptIdsToMatch } }] : []),
      ],
    };

    // 1. Total active pool questions for this topic (and difficulty, if specified)
    const totalActiveCount = await this.prisma.question.count({
      where: questionMatchFilter,
    });

    // 2. Count distinct questions used in ExamConfigQuestionUsage by OTHER configs
    const allocatedToOtherConfigsCount = await this.prisma.examConfigQuestionUsage.count({
      where: {
        configId: { not: configId },
        question: questionMatchFilter,
      },
    });

    // 3. Calculate claimed questions by OTHER active/validated exam configs mapping this topic
    const otherMappedSections = await this.prisma.sectionTopic.findMany({
      where: {
        topicId: { in: topicIdsToMatch },
        section: {
          examConfig: {
            id: { not: configId },
            isArchived: false,
            status: { not: "ARCHIVED" },
          },
        },
      },
      include: {
        section: {
          include: {
            sectionTopics: true,
          },
        },
      },
    });

    let claimedByOtherConfigs = 0;
    const processedOtherConfigIds = new Set<string>();

    for (const st of otherMappedSections) {
      const otherConfigId = st.section.examConfigId;
      if (processedOtherConfigIds.has(otherConfigId)) continue;
      processedOtherConfigIds.add(otherConfigId);

      // Check how many questions otherConfig has ALREADY allocated for this topic
      const alreadyAllocatedCount = await this.prisma.examConfigQuestionUsage.count({
        where: {
          configId: otherConfigId,
          question: questionMatchFilter,
        },
      });

      const sectionTopicCount = st.section.sectionTopics.length || 1;
      const sectionRequiredForTopic = Math.ceil(st.section.questionCount / sectionTopicCount);

      // Remaining claim = max(0, required - alreadyAllocated)
      const remainingClaim = Math.max(0, sectionRequiredForTopic - alreadyAllocatedCount);
      claimedByOtherConfigs += remainingClaim;
    }

    const netAvailable = totalActiveCount - allocatedToOtherConfigsCount - claimedByOtherConfigs;
    return Math.max(0, netAvailable);
  }

  /**
   * Finds conflicting config names if questions for this topic were used or claimed by another config.
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

    const mappings = await this.prisma.sectionTopic.findMany({
      where: {
        topicId: { in: topicIdsToMatch },
        section: {
          examConfig: {
            id: { not: currentConfigId },
            isArchived: false,
            status: { not: "ARCHIVED" },
          },
        },
      },
      select: {
        section: {
          select: {
            examConfig: {
              select: { name: true },
            },
          },
        },
      },
      take: 5,
    });

    const usageNames = usages.map((u: any) => u.examConfig.name);
    const mappingNames = mappings.map((m: any) => m.section.examConfig.name);

    const names: string[] = Array.from(new Set([...usageNames, ...mappingNames]));
    return names;
  }
}
