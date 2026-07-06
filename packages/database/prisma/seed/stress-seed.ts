import { PrismaClient, QuestionStatus } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Starting 25,000 Question Stress Seed & Benchmark ---");

  // 1. Get existing active topic and section
  const topic = await prisma.topic.findFirst({ where: { status: "ACTIVE" } });
  const section = await prisma.examSection.findFirst();

  if (!topic || !section) {
    console.error("❌ Error: Please run the standard db seed first to create topics and sections.");
    process.exit(1);
  }

  console.log(`Using Topic: ${topic.name} (${topic.id})`);
  console.log(`Using Section: ${section.name} (${section.id})`);

  // 2. Count current questions
  const initialCount = await prisma.question.count();
  console.log(`Initial Question count in database: ${initialCount}`);

  const TARGET_COUNT = 25000;
  const needToSeed = Math.max(0, TARGET_COUNT - initialCount);

  if (needToSeed > 0) {
    console.log(`Seeding ${needToSeed} questions to reach target of 25,000...`);
    const chunkSize = 5000;
    const difficulties = ["EASY", "MEDIUM", "HARD"];
    const now = new Date();

    for (let i = 0; i < needToSeed; i += chunkSize) {
      const currentChunkSize = Math.min(chunkSize, needToSeed - i);
      console.log(`Generating chunk of ${currentChunkSize} questions...`);

      const questionsData = [];
      const versionsData = [];
      const usagesData = [];

      for (let j = 0; j < currentChunkSize; j++) {
        const qId = "stress_" + createId();
        const diff = difficulties[(i + j) % difficulties.length];
        const questionText = `Stress Test Question ${i + j}: What is the value of variable X in context of ${topic.name}?`;
        const answer = `Option A_${i + j}`;
        const options = [`Option A_${i + j}`, `Option B_${i + j}`, `Option C_${i + j}`, `Option D_${i + j}`];
        const explanation = `This is a stress test explanation for question number ${i + j}.`;

        questionsData.push({
          id: qId,
          questionText,
          answer,
          explanation,
          topicId: topic.id,
          sectionId: section.id,
          difficulty: diff,
          difficultyScore: 0.5,
          source: "GENERATED",
          version: 1,
          status: QuestionStatus.ACTIVE,
          metadata: { options },
          createdAt: now,
          updatedAt: now,
        });

        versionsData.push({
          id: "ver_" + createId(),
          questionId: qId,
          version: 1,
          snapshot: {
            id: qId,
            questionText,
            answer,
            explanation,
            topicId: topic.id,
            sectionId: section.id,
            difficulty: diff,
            source: "GENERATED",
            status: QuestionStatus.ACTIVE,
            options,
          },
          createdAt: now,
        });

        usagesData.push({
          id: "use_" + createId(),
          questionId: qId,
          timesUsed: 0,
          lastUsed: null,
          sectionUsage: {},
          examUsage: {},
          createdAt: now,
          updatedAt: now,
        });
      }

      console.log(`Writing chunk to database...`);
      await prisma.$transaction(async (tx) => {
        await tx.question.createMany({ data: questionsData });
        await tx.questionVersion.createMany({ data: versionsData });
        await tx.questionUsage.createMany({ data: usagesData });
      });
      console.log(`Chunk written successfully.`);
    }
  } else {
    console.log("Database already has 25,000+ questions. Skipping seeding.");
  }

  const finalCount = await prisma.question.count();
  console.log(`Final Question count in database: ${finalCount}`);

  // 3. Latency Benchmarks
  console.log("\n--- Running Latency Benchmarks ---");

  // Test 1: Search Latency (Keyword search using findMany on questionText)
  const searchStart = Date.now();
  const searchResults = await prisma.question.findMany({
    where: {
      questionText: {
        contains: "Stress Test Question 12345",
      },
    },
    take: 20,
  });
  const searchDuration = Date.now() - searchStart;
  console.log(`⏱️ Search Latency: ${searchDuration}ms (Found ${searchResults.length} matches)`);

  // Test 2: Filter Latency (Filter by Topic & Difficulty)
  const filterStart = Date.now();
  const filterResults = await prisma.question.findMany({
    where: {
      topicId: topic.id,
      difficulty: "MEDIUM",
      status: QuestionStatus.ACTIVE,
    },
    take: 50,
  });
  const filterDuration = Date.now() - filterStart;
  console.log(`⏱️ Filter Latency: ${filterDuration}ms (Found ${filterResults.length} matches)`);

  // Test 3: Pagination Latency (Skip/Take over large offset)
  const pageStart = Date.now();
  const pageResults = await prisma.question.findMany({
    where: {
      status: QuestionStatus.ACTIVE,
    },
    skip: 20000,
    take: 20,
    orderBy: { createdAt: "desc" },
  });
  const pageDuration = Date.now() - pageStart;
  console.log(`⏱️ Pagination Latency: ${pageDuration}ms (Loaded ${pageResults.length} records)`);

  console.log("\n--- Benchmarks Complete ---");

  // Output test results object to process.stdout for parent scripts to read
  const report = {
    totalQuestions: finalCount,
    searchLatencyMs: searchDuration,
    filterLatencyMs: filterDuration,
    paginationLatencyMs: pageDuration,
    slaTargets: {
      search: 300,
      filter: 500,
      pagination: 200,
    },
    status: {
      search: searchDuration < 300 ? "PASSED" : "FAILED",
      filter: filterDuration < 500 ? "PASSED" : "FAILED",
      pagination: pageDuration < 200 ? "PASSED" : "FAILED",
    }
  };

  console.log("Result JSON:", JSON.stringify(report, null, 2));
}

main()
  .catch((e) => {
    console.error("Stress seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
