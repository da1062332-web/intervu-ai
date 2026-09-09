const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: 'apps/api/.env' });

const prisma = new PrismaClient();

async function main() {
  const configId = 'cmsifafam000099s9csfe33pg';
  console.log(`Profiling BATCH OPTIMIZED validation for ${configId}...`);

  const tStart = Date.now();

  // 1. Fetch ExamConfig
  const t0 = Date.now();
  const config = await prisma.examConfig.findUnique({
    where: { id: configId },
    include: { sections: true }
  });
  console.log(`[1] ExamConfig: ${Date.now() - t0}ms`);

  const sections = config.sections;
  const sectionIds = sections.map(s => s.id);

  // 2. Knowledge layer batch
  const t1 = Date.now();
  const [allMappings, weightageSums] = await Promise.all([
    prisma.sectionTopic.findMany({
      where: { sectionId: { in: sectionIds } },
      include: {
        topic: {
          include: {
            concepts: { where: { status: 'ACTIVE' } }
          }
        }
      }
    }),
    prisma.topicWeightage.groupBy({
      by: ['sectionId'],
      where: { sectionId: { in: sectionIds } },
      _sum: { weightagePercentage: true }
    })
  ]);
  console.log(`[2] Knowledge Layer Batch (2 queries in parallel): ${Date.now() - t1}ms | Mappings: ${allMappings.length}, Weightages: ${weightageSums.length}`);

  // 3. Blueprint validation batch
  const t2 = Date.now();
  const blueprint = await prisma.blueprint.findFirst({ where: { configId } });
  console.log(`[3] Blueprint fetch: ${Date.now() - t2}ms`);

  if (blueprint) {
    const rawSections = blueprint.sections || [];
    const allTopicIds = new Set();
    for (const sec of rawSections) {
      for (const a of sec.topicAllocations || []) {
        allTopicIds.add(a.topicId);
      }
    }
    const topicIdArray = Array.from(allTopicIds);

    // Batch fetch topics and concepts
    const t3 = Date.now();
    const topics = await prisma.topic.findMany({
      where: { id: { in: topicIdArray }, status: 'ACTIVE' },
      include: { concepts: { where: { status: 'ACTIVE' } } }
    });

    const allConcepts = topics.flatMap(t => t.concepts);
    const conceptIds = allConcepts.map(c => c.id);

    // Batch fetch question counts grouped by conceptId and difficulty
    const questionCounts = conceptIds.length > 0 ? await prisma.question.groupBy({
      by: ['conceptId', 'difficulty'],
      where: { conceptId: { in: conceptIds }, status: 'ACTIVE' },
      _count: { id: true }
    }) : [];

    console.log(`[4] Blueprint Batch (topics + concepts + question counts): ${Date.now() - t3}ms | Concepts: ${allConcepts.length}, Groups: ${questionCounts.length}`);
  }

  const total = Date.now() - tStart;
  console.log(`\n>>> TOTAL BATCHED VALIDATION TIME: ${total}ms (vs >60000ms previously!) <<<`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
