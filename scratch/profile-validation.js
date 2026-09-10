const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: 'apps/api/.env' });

const prisma = new PrismaClient();

async function main() {
  const configId = 'cmsifafam000099s9csfe33pg';
  console.log(`Connecting to database and profiling validation for configId: ${configId}...`);

  // 1. Check Config
  const t0 = Date.now();
  const config = await prisma.examConfig.findUnique({
    where: { id: configId },
    include: { sections: true }
  });
  console.log(`ExamConfig fetch: ${Date.now() - t0}ms | Found: ${Boolean(config)} | Sections: ${config?.sections?.length}`);

  if (!config) {
    console.log('Config not found!');
    return;
  }

  // 2. Profile Knowledge Layer queries
  const t1 = Date.now();
  const sections = await prisma.examSection.findMany({ where: { examConfigId: configId } });
  console.log(`Sections count: ${sections.length} (${Date.now() - t1}ms)`);

  let topicMappingCount = 0;
  for (const s of sections) {
    const mappings = await prisma.sectionTopic.findMany({ where: { sectionId: s.id } });
    topicMappingCount += mappings.length;
  }
  console.log(`Total section topics: ${topicMappingCount} (${Date.now() - t1}ms)`);

  // 3. Profile Blueprint
  const t2 = Date.now();
  const blueprint = await prisma.blueprint.findFirst({ where: { configId } });
  console.log(`Blueprint fetch: ${Date.now() - t2}ms | Found: ${Boolean(blueprint)}`);

  if (blueprint) {
    const rawSections = blueprint.sections || [];
    console.log(`Blueprint sections: ${rawSections.length}`);
    let totalAllocs = 0;
    for (const sec of rawSections) {
      totalAllocs += (sec.topicAllocations || []).length;
    }
    console.log(`Total topic allocations in blueprint: ${totalAllocs}`);
  }

  // 4. Test actual validateBlueprintLayer simulation
  const t3 = Date.now();
  if (blueprint && blueprint.sections) {
    console.log("\nSimulating Blueprint validation queries...");
    const rawSections = blueprint.sections || [];
    let queryCount = 0;
    for (const section of rawSections) {
      for (const alloc of section.topicAllocations || []) {
        const topic = await prisma.topic.findUnique({
          where: { id: alloc.topicId },
          include: { concepts: true }
        });
        queryCount++;
        const concepts = topic?.concepts?.map(c => c.code) || [];
        for (const diff of ['EASY', 'MEDIUM', 'HARD']) {
          const dbConcepts = await prisma.concept.findMany({
            where: { code: { in: concepts } }
          });
          queryCount++;
          const conceptIds = dbConcepts.map(c => c.id);
          const count = await prisma.question.count({
            where: { conceptId: { in: conceptIds }, status: 'ACTIVE', difficulty: diff }
          });
          queryCount++;
        }
      }
    }
    console.log(`Blueprint simulation: ${queryCount} queries executed in ${Date.now() - t3}ms`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
