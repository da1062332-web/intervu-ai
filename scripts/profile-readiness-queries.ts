import { PrismaClient, QuestionStatus, QuestionSourceType } from "@prisma/client";

const prisma = new PrismaClient();

async function profileQueries() {
  const config = await prisma.examConfig.findFirst({
    where: { name: "TCS-NQT" },
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

  if (!config) return;

  const allTopics: Array<{ id: string; code?: string; name?: string }> = [];
  for (const s of config.sections) {
    for (const st of s.sectionTopics) {
      if (st.topic) {
        allTopics.push({ id: st.topic.id, code: st.topic.code, name: st.topic.name });
      }
    }
  }

  console.log(`Profiling queries for config ${config.name} (${allTopics.length} topics)...`);

  const rawIds = allTopics.map((t) => t.id).filter(Boolean);
  const rawCodes = allTopics.map((t) => t.code).filter(Boolean) as string[];

  let t = Date.now();
  const topicRecords = await prisma.topic.findMany({
    where: {
      OR: [
        { id: { in: rawIds } },
        ...(rawCodes.length > 0 ? [{ code: { in: rawCodes } }] : []),
      ],
    },
    include: { concepts: true },
  });
  console.log(`1. topic.findMany: ${Date.now() - t}ms (${topicRecords.length} records)`);

  const allResolvedTopicIds = Array.from(new Set(rawIds.concat(topicRecords.map((t) => t.id))));
  const conceptIdArr = Array.from(new Set(topicRecords.flatMap((t) => t.concepts.map((c) => c.id))));

  t = Date.now();
  const qTopicGroup = await prisma.question.groupBy({
    by: ["topicId", "difficulty", "questionSource"],
    where: {
      status: QuestionStatus.ACTIVE,
      topicId: { in: allResolvedTopicIds },
    },
    _count: { _all: true },
  });
  console.log(`2. question.groupBy (topic): ${Date.now() - t}ms (${qTopicGroup.length} groups)`);

  t = Date.now();
  const qConceptGroup = conceptIdArr.length > 0 ? await prisma.question.groupBy({
    by: ["conceptId", "difficulty", "questionSource"],
    where: {
      status: QuestionStatus.ACTIVE,
      conceptId: { in: conceptIdArr },
    },
    _count: { _all: true },
  }) : [];
  console.log(`3. question.groupBy (concept): ${Date.now() - t}ms (${qConceptGroup.length} groups)`);

  t = Date.now();
  const sectionTopicRes = await prisma.sectionTopic.findMany({
    where: {
      topicId: { in: allResolvedTopicIds },
      section: {
        examConfig: {
          id: { not: config.id },
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
  console.log(`4. sectionTopic.findMany: ${Date.now() - t}ms (${sectionTopicRes.length} records)`);

  t = Date.now();
  const usageGroup = await prisma.examConfigQuestionUsage.groupBy({
    by: ["configId"],
    where: {
      configId: { not: config.id },
      question: {
        status: QuestionStatus.ACTIVE,
        questionSource: { not: QuestionSourceType.MANUAL },
        OR: [
          { topicId: { in: allResolvedTopicIds } },
          ...(conceptIdArr.length > 0 ? [{ conceptId: { in: conceptIdArr } }] : []),
        ],
      },
    },
    _count: { questionId: true },
  });
  console.log(`5. examConfigQuestionUsage.groupBy: ${Date.now() - t}ms (${usageGroup.length} groups)`);

  t = Date.now();
  const conflicts = await prisma.examConfigQuestionUsage.findMany({
    where: {
      configId: { not: config.id },
      question: {
        topicId: { in: allResolvedTopicIds },
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
  console.log(`6. conflicts findMany: ${Date.now() - t}ms (${conflicts.length} records)`);

  t = Date.now();
  const manualCount = await prisma.question.count({
    where: {
      questionSource: "MANUAL",
      status: "ACTIVE",
    },
  });
  console.log(`7. manual questions count: ${Date.now() - t}ms (${manualCount} questions)`);
}

profileQueries()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
