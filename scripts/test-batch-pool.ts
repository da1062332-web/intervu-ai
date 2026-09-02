import { PrismaClient, QuestionStatus, QuestionSourceType, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

interface TopicCapacity {
  total: number;
  EASY: number;
  MEDIUM: number;
  HARD: number;
}

export async function getBatchUnusedPoolCounts(
  configId: string,
  rawTopics: Array<{ id: string; code?: string; name?: string }>,
): Promise<Map<string, TopicCapacity>> {
  const result = new Map<string, TopicCapacity>();
  if (rawTopics.length === 0) return result;

  const rawIds = rawTopics.map((t) => t.id).filter(Boolean);
  const rawCodes = rawTopics.map((t) => t.code).filter(Boolean) as string[];

  // 1. Fetch all Topic records + Concepts in ONE batch query
  const topicRecords = await prisma.topic.findMany({
    where: {
      OR: [
        { id: { in: rawIds } },
        ...(rawCodes.length > 0 ? [{ code: { in: rawCodes } }] : []),
      ],
    },
    include: { concepts: true },
  });

  const topicMap = new Map<string, { topicIds: string[]; conceptIds: string[] }>();
  const allResolvedTopicIds = new Set<string>();
  const allConceptIds = new Set<string>();

  for (const raw of rawTopics) {
    const matched = topicRecords.find(
      (rec) => rec.id === raw.id || (raw.code && rec.code === raw.code),
    );
    if (matched) {
      const tIds = Array.from(new Set([raw.id, matched.id, matched.code]));
      const cIds = matched.concepts.map((c) => c.id);
      topicMap.set(raw.id, { topicIds: tIds, conceptIds: cIds });
      tIds.forEach((id) => allResolvedTopicIds.add(id));
      cIds.forEach((id) => allConceptIds.add(id));
    } else {
      topicMap.set(raw.id, { topicIds: [raw.id], conceptIds: [] });
      allResolvedTopicIds.add(raw.id);
    }
  }

  const resolvedTopicIdArr = Array.from(allResolvedTopicIds);
  const conceptIdArr = Array.from(allConceptIds);

  // 2. Run All Aggregations Concurrently in ONE roundtrip
  const [
    groupedByTopic,
    groupedByConcept,
    otherMappedSections,
    usageGroupedByConfigAndTopic,
  ] = await Promise.all([
    // Active questions by Topic, Difficulty, Source
    prisma.question.groupBy({
      by: ["topicId", "difficulty", "questionSource"],
      where: {
        status: QuestionStatus.ACTIVE,
        topicId: { in: resolvedTopicIdArr },
      },
      _count: { _all: true },
    }),

    // Active questions by Concept, Difficulty, Source
    conceptIdArr.length > 0
      ? prisma.question.groupBy({
          by: ["conceptId", "difficulty", "questionSource"],
          where: {
            status: QuestionStatus.ACTIVE,
            conceptId: { in: conceptIdArr },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),

    // Other configs with overlapping topic sections
    prisma.sectionTopic.findMany({
      where: {
        topicId: { in: resolvedTopicIdArr },
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
    }),

    // Question usage by other configs for these topics
    prisma.examConfigQuestionUsage.groupBy({
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

  // Build lookup maps for instant in-memory calculation
  const allocatedMap = new Map<string, number>();
  for (const item of usageGroupedByConfigAndTopic) {
    allocatedMap.set(item.configId, item._count.questionId);
  }

  // Pre-calculate other configs' claimed capacity per topic
  const otherClaimsByTopic = new Map<string, number>();
  const processedOtherConfigs = new Set<string>();

  for (const st of otherMappedSections) {
    const otherConfigId = st.section.examConfigId;
    const topicIdKey = st.topicId;
    const dedupeKey = `${otherConfigId}:${topicIdKey}`;
    if (processedOtherConfigs.has(dedupeKey)) continue;
    processedOtherConfigs.add(dedupeKey);

    const alreadyAllocatedCount = allocatedMap.get(otherConfigId) || 0;
    const sectionTopicCount = st.section.sectionTopics.length || 1;
    const sectionRequiredForTopic = Math.ceil(st.section.questionCount / sectionTopicCount);
    const remainingClaim = Math.max(0, sectionRequiredForTopic - alreadyAllocatedCount);

    otherClaimsByTopic.set(
      topicIdKey,
      (otherClaimsByTopic.get(topicIdKey) || 0) + remainingClaim,
    );
  }

  // Calculate capacity per raw topic in memory
  for (const raw of rawTopics) {
    const meta = topicMap.get(raw.id) || { topicIds: [raw.id], conceptIds: [] };
    const tIdSet = new Set(meta.topicIds);
    const cIdSet = new Set(meta.conceptIds);

    // Sum manual and template counts per tier
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

async function testBenchmark() {
  const configs = await prisma.examConfig.findMany({
    take: 3,
    include: {
      sections: {
        include: {
          sectionTopics: {
            include: { topic: true },
          },
        },
      },
    },
  });

  console.log(`\n🧪 Testing Fast Batch Pool Count Across ${configs.length} Configs...`);

  for (const cfg of configs) {
    const allTopics: Array<{ id: string; code?: string; name?: string }> = [];
    for (const s of cfg.sections) {
      for (const st of s.sectionTopics) {
        if (st.topic) {
          allTopics.push({ id: st.topic.id, code: st.topic.code, name: st.topic.name });
        }
      }
    }

    const t0 = Date.now();
    const batchCounts = await getBatchUnusedPoolCounts(cfg.id, allTopics);
    const elapsed = Date.now() - t0;

    console.log(`\n⚡ Config "${cfg.name}" (${cfg.id}):`);
    console.log(`   Topics evaluated: ${allTopics.length} | ⏱️ Elapsed: ${elapsed}ms (${(elapsed / 1000).toFixed(3)}s)`);
    for (const [tId, cap] of batchCounts) {
      console.log(`   Topic [${tId}]: Total=${cap.total}, Easy=${cap.EASY}, Med=${cap.MEDIUM}, Hard=${cap.HARD}`);
    }
  }
}

testBenchmark()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
