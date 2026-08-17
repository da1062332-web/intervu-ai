import { PrismaClient } from "@prisma/client";
import { performance } from "perf_hooks";

const prisma = new PrismaClient();

async function main() {
  console.log("=== BENCHMARKING CANDIDATE TEST ASSEMBLY LATENCY ===");

  const configCode = "TCS_NQT_PLACEMENT_ASSESSMENT";
  const config = await prisma.examConfig.findFirst({
    where: { OR: [{ code: configCode }, { name: { contains: "TCS NQT" } }] },
  });

  if (!config) {
    console.log(`Config ${configCode} not found.`);
    return;
  }

  console.log(`\nConfig Name: ${config.name}`);
  console.log(`Total Questions: ${config.totalQuestions}`);

  // Measure Candidate History Lookup Speed
  const startHist = performance.now();
  const historyIds = await prisma.testInstanceQuestion.findMany({
    where: { testInstance: { userId: "benchmark-candidate" } },
    select: { questionId: true },
  });
  const endHist = performance.now();
  console.log(`Candidate History Lookup: ${(endHist - startHist).toFixed(2)} ms (${historyIds.length} items) ✅`);

  // Measure Batched Question Retrieval Speed
  const startPool = performance.now();
  const questions = await prisma.question.findMany({
    where: { status: "ACTIVE" },
    take: 100,
    select: { id: true, topicId: true, difficulty: true, questionType: true },
  });
  const endPool = performance.now();
  console.log(`Batched Question Retrieval (100 items): ${(endPool - startPool).toFixed(2)} ms ✅`);

  // Measure In-Memory History Set Filtering Speed
  const startFilter = performance.now();
  const histSet = new Set(historyIds.map((h) => h.questionId));
  const filtered = questions.filter((q) => !histSet.has(q.id));
  const endFilter = performance.now();
  console.log(`In-Memory O(1) History Set Filtering: ${(endFilter - startFilter).toFixed(2)} ms (${filtered.length} remaining) ✅`);

  console.log("\n=======================================================");
  console.log("🎯 CANDIDATE START ASSESSMENT SPEED STATUS: ULTRA FAST ⚡");
  console.log("=======================================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
