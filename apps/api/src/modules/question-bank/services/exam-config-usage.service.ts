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
    const batchRes = await this.findBatchConflictingConfigs(currentConfigId, [topicId]);
    return batchRes.get(topicId) || [];
  }

  /**
   * Batch resolves conflicting configurations for multiple topics in a single query.
   */
  async findBatchConflictingConfigs(
    currentConfigId: string,
    topicIds: string[],
  ): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    if (topicIds.length === 0) return result;

    const usages = await this.prisma.examConfigQuestionUsage.findMany({
      where: {
        configId: { not: currentConfigId },
        question: {
          topicId: { in: topicIds },
          status: QuestionStatus.ACTIVE,
          questionSource: { not: QuestionSourceType.MANUAL },
        },
      },
      select: {
        question: {
          select: { topicId: true },
        },
        examConfig: {
          select: { name: true },
        },
      },
      take: 20,
    });

    for (const u of usages) {
      const tId = u.question?.topicId;
      const name = u.examConfig?.name;
      if (tId && name) {
        if (!result.has(tId)) result.set(tId, []);
        const list = result.get(tId)!;
        if (!list.includes(name) && list.length < 5) {
          list.push(name);
        }
      }
    }

    return result;
  }

  /**
   * Ultra-fast bulk aggregation: Computes unused question capacities for ALL topics and tiers in a config in ONE batch.
   */
  async getBatchUnusedPoolCounts(
    configId: string,
    rawTopics: Array<{ id: string; code?: string; name?: string }>,
  ): Promise<Map<string, { total: number; EASY: number; MEDIUM: number; HARD: number }>> {
    const result = new Map<string, { total: number; EASY: number; MEDIUM: number; HARD: number }>();
    if (rawTopics.length === 0) return result;

    const rawIds = rawTopics.map((t) => t.id).filter(Boolean);
    const rawCodes = rawTopics.map((t) => t.code).filter(Boolean) as string[];

    // 1. Fetch Topic & Concept mappings
    const topicRecords = await this.prisma.topic.findMany({
      where: {
        OR: [
          { id: { in: rawIds } },
          ...(rawCodes.length > 0 ? [{ code: { in: rawCodes } }] : []),
        ],
      },
      include: { concepts: true },
    });

    const topicMetaMap = new Map<string, { topicIds: string[]; conceptIds: string[] }>();
    const allResolvedTopicIds = new Set<string>();
    const allConceptIds = new Set<string>();

    for (const raw of rawTopics) {
      const matched = topicRecords.find(
        (rec) => rec.id === raw.id || (raw.code && rec.code === raw.code),
      );
      if (matched) {
        const tIds = Array.from(new Set([raw.id, matched.id, matched.code]));
        const cIds = matched.concepts.map((c) => c.id);
        topicMetaMap.set(raw.id, { topicIds: tIds, conceptIds: cIds });
        tIds.forEach((id) => allResolvedTopicIds.add(id));
        cIds.forEach((id) => allConceptIds.add(id));
      } else {
        topicMetaMap.set(raw.id, { topicIds: [raw.id], conceptIds: [] });
        allResolvedTopicIds.add(raw.id);
      }
    }

    const resolvedTopicIdArr = Array.from(allResolvedTopicIds);
    const conceptIdArr = Array.from(allConceptIds);

    // 2. Parallel Bulk DB Queries
    const [
      groupedByTopic,
      groupedByConcept,
      otherMappedSections,
      usageGroupedByConfig,
    ] = await Promise.all([
      this.prisma.question.groupBy({
        by: ["topicId", "difficulty", "questionSource"],
        where: {
          status: QuestionStatus.ACTIVE,
          topicId: { in: resolvedTopicIdArr },
        },
        _count: { _all: true },
      }),
      conceptIdArr.length > 0
        ? this.prisma.question.groupBy({
            by: ["conceptId", "difficulty", "questionSource"],
            where: {
              status: QuestionStatus.ACTIVE,
              conceptId: { in: conceptIdArr },
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      this.prisma.$queryRaw<Array<{ topicId: string; configId: string; questionCount: number; sectionTopicCount: number }>>`
        SELECT 
          st."topicId" AS "topicId",
          s."examConfigId" AS "configId",
          s."questionCount" AS "questionCount",
          (SELECT COUNT(*)::int FROM "SectionTopic" st2 WHERE st2."sectionId" = s.id) AS "sectionTopicCount"
        FROM "SectionTopic" st
        JOIN "ExamSection" s ON st."sectionId" = s.id
        JOIN "ExamConfig" c ON s."examConfigId" = c.id
        WHERE st."topicId" = ANY(${resolvedTopicIdArr}::text[])
          AND c.id != ${configId}
          AND c."isArchived" = false
          AND c.status != 'ARCHIVED';
      `.catch(() => []),
      this.prisma.examConfigQuestionUsage.groupBy({
        by: ["configId"],
        where: {
          configId: { not: configId },
          question: {
            status: QuestionStatus.ACTIVE,
            questionSource: { not: QuestionSourceType.MANUAL },
            OR: [
              { topicId: { in: resolvedTopicIdArr } },
              ...(conceptIdArr.length > 0 ? [{ conceptId: { in: conceptIdArr } }] : []),
            ],
          },
        },
        _count: { questionId: true },
      }),
    ]);

    // 3. Process claims and allocations in-memory
    const allocatedMap = new Map<string, number>();
    for (const item of usageGroupedByConfig) {
      allocatedMap.set(item.configId, item._count.questionId);
    }

    const otherClaimsByTopic = new Map<string, number>();
    const processedOtherConfigs = new Set<string>();

    for (const row of otherMappedSections) {
      const otherConfigId = row.configId;
      const topicIdKey = row.topicId;
      const dedupeKey = `${otherConfigId}:${topicIdKey}`;
      if (processedOtherConfigs.has(dedupeKey)) continue;
      processedOtherConfigs.add(dedupeKey);

      const alreadyAllocatedCount = allocatedMap.get(otherConfigId) || 0;
      const sectionTopicCount = row.sectionTopicCount || 1;
      const sectionRequiredForTopic = Math.ceil(
        row.questionCount / sectionTopicCount,
      );
      const remainingClaim = Math.max(0, sectionRequiredForTopic - alreadyAllocatedCount);

      otherClaimsByTopic.set(
        topicIdKey,
        (otherClaimsByTopic.get(topicIdKey) || 0) + remainingClaim,
      );
    }

    // 4. In-Memory aggregation per topic & tier
    for (const raw of rawTopics) {
      const meta = topicMetaMap.get(raw.id) || { topicIds: [raw.id], conceptIds: [] };
      const tIdSet = new Set(meta.topicIds);
      const cIdSet = new Set(meta.conceptIds);

      const calcTier = (diff?: "EASY" | "MEDIUM" | "HARD") => {
        let manual = 0;
        let template = 0;

        for (const row of groupedByTopic) {
          if (row.topicId && tIdSet.has(row.topicId)) {
            if (!diff || row.difficulty === diff) {
              if (row.questionSource === QuestionSourceType.MANUAL) {
                manual += row._count._all;
              } else {
                template += row._count._all;
              }
            }
          }
        }

        for (const row of groupedByConcept) {
          if (row.conceptId && cIdSet.has(row.conceptId)) {
            if (!diff || row.difficulty === diff) {
              if (row.questionSource === QuestionSourceType.MANUAL) {
                manual += row._count._all;
              } else {
                template += row._count._all;
              }
            }
          }
        }

        let otherClaims = 0;
        for (const tId of meta.topicIds) {
          otherClaims += otherClaimsByTopic.get(tId) || 0;
        }

        const netTemplate = Math.max(0, template - otherClaims);
        return manual + netTemplate;
      };

      result.set(raw.id, {
        total: calcTier(undefined),
        EASY: calcTier("EASY"),
        MEDIUM: calcTier("MEDIUM"),
        HARD: calcTier("HARD"),
      });
    }

    return result;
  }
}
