import { Injectable, Inject } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionStatus, QuestionSourceType, Prisma } from "@prisma/client";
import { AppLogger } from "@intervu-ai/shared-logger";
import { TransactionalOutboxService } from "./transactional-outbox.service";

@Injectable()
export class ExamConfigUsageService {
  private readonly logger = new AppLogger({ name: "ExamConfigUsageService" });

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TransactionalOutboxService)
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

  private readonly topicMatchCache = new Map<
    string,
    { topicIdsToMatch: string[]; conceptIdsToMatch: string[] }
  >();
  private readonly otherMappedSectionsCache = new Map<string, any[]>();

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
      if (this.topicMatchCache.has(topicId)) {
        const cached = this.topicMatchCache.get(topicId)!;
        topicIdsToMatch = cached.topicIdsToMatch;
        conceptIdsToMatch = cached.conceptIdsToMatch;
      } else {
        const topicObj = await this.prisma.topic.findFirst({
          where: { OR: [{ code: topicId }, { id: topicId }] },
          include: { concepts: true },
        });
        if (topicObj) {
          topicIdsToMatch = Array.from(
            new Set([topicId, topicObj.id, topicObj.code]),
          );
          conceptIdsToMatch = topicObj.concepts.map((c) => c.id);
        }
        this.topicMatchCache.set(topicId, {
          topicIdsToMatch,
          conceptIdsToMatch,
        });
      }
    }

    const baseQuestionFilter: Prisma.QuestionWhereInput = {
      status: QuestionStatus.ACTIVE,
      difficulty: difficulty || undefined,
      OR: [
        { topicId: { in: topicIdsToMatch } },
        ...(conceptIdsToMatch.length > 0
          ? [{ conceptId: { in: conceptIdsToMatch } }]
          : []),
      ],
    };

    // 1-3. Run manualActiveCount, templateActiveCount, and templateAllocatedToOtherConfigsCount concurrently
    const templateQuestionFilter: Prisma.QuestionWhereInput = {
      ...baseQuestionFilter,
      questionSource: { not: QuestionSourceType.MANUAL },
    };

    const otherMappedCacheKey = topicIdsToMatch.slice().sort().join(",");
    let otherMappedSectionsPromise: Promise<any[]>;
    if (this.otherMappedSectionsCache.has(otherMappedCacheKey)) {
      otherMappedSectionsPromise = Promise.resolve(
        this.otherMappedSectionsCache.get(otherMappedCacheKey)!,
      );
    } else {
      otherMappedSectionsPromise = this.prisma.sectionTopic
        .findMany({
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
        })
        .then((res) => {
          this.otherMappedSectionsCache.set(otherMappedCacheKey, res);
          return res;
        });
    }

    const [
      manualActiveCount,
      templateActiveCount,
      templateAllocatedToOtherConfigsCount,
      otherMappedSections,
    ] = await Promise.all([
      this.prisma.question.count({
        where: {
          ...baseQuestionFilter,
          questionSource: QuestionSourceType.MANUAL,
        },
      }),
      this.prisma.question.count({
        where: templateQuestionFilter,
      }),
      this.prisma.examConfigQuestionUsage.count({
        where: {
          configId: { not: configId },
          question: templateQuestionFilter,
        },
      }),
      otherMappedSectionsPromise,
    ]);

    const uniqueOtherConfigIds = Array.from(
      new Set(otherMappedSections.map((st: any) => st.section.examConfigId)),
    );

    const allocatedCounts =
      uniqueOtherConfigIds.length > 0
        ? await this.prisma.examConfigQuestionUsage.groupBy({
            by: ["configId"],
            where: {
              configId: { in: uniqueOtherConfigIds },
              question: templateQuestionFilter,
            },
            _count: {
              questionId: true,
            },
          })
        : [];

    const allocatedMap = new Map<string, number>();
    for (const item of allocatedCounts) {
      allocatedMap.set(item.configId, item._count.questionId);
    }

    let templateClaimedByOtherConfigs = 0;
    const processedOtherConfigIds = new Set<string>();

    for (const st of otherMappedSections) {
      const otherConfigId = st.section.examConfigId;
      if (processedOtherConfigIds.has(otherConfigId)) continue;
      processedOtherConfigIds.add(otherConfigId);

      const alreadyAllocatedCount = allocatedMap.get(otherConfigId) || 0;

      const sectionTopicCount = st.section.sectionTopics.length || 1;
      const sectionRequiredForTopic = Math.ceil(
        st.section.questionCount / sectionTopicCount,
      );

      const remainingClaim = Math.max(
        0,
        sectionRequiredForTopic - alreadyAllocatedCount,
      );
      templateClaimedByOtherConfigs += remainingClaim;
    }

    const netTemplateAvailable = Math.max(
      0,
      templateActiveCount -
        templateAllocatedToOtherConfigsCount -
        templateClaimedByOtherConfigs,
    );

    return manualActiveCount + netTemplateAvailable;
  }

  /**
   * Finds conflicting config names if template questions for this topic were used by another config.
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
        topicIdsToMatch = Array.from(
          new Set([topicId, topicObj.id, topicObj.code]),
        );
      }
    }

    const usages = await this.prisma.examConfigQuestionUsage.findMany({
      where: {
        configId: { not: currentConfigId },
        question: {
          topicId: { in: topicIdsToMatch },
          status: QuestionStatus.ACTIVE,
          questionSource: { not: QuestionSourceType.MANUAL },
        },
      },
      select: {
        examConfig: {
          select: { name: true },
        },
      },
      take: 5,
    });

    const usageNames = usages
      .map((u: any) => u.examConfig?.name)
      .filter((name: string | undefined): name is string => Boolean(name));

    return Array.from(new Set(usageNames));
  }
}
