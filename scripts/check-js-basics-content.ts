import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log(
    "🔍 Checking database resources for topic 'JavaScript Basics'...\n",
  );

  // 1. Find the topic
  const topic = await prisma.topic.findFirst({
    where: { name: { contains: "JavaScript Basics", mode: "insensitive" } },
    include: { concepts: true },
  });

  if (!topic) {
    console.log("❌ Topic 'JavaScript Basics' not found in database.");
    await prisma.$disconnect();
    return;
  }

  console.log(`📋 Topic: "${topic.name}" (${topic.id})`);
  console.log(
    `📋 Concepts: ${topic.concepts.map((c) => `"${c.name}" (Code: ${c.code}, Status: ${c.status})`).join(", ")}`,
  );
  console.log("\n");

  const conceptCodes = topic.concepts.map((c) => c.code);
  const conceptIds = topic.concepts.map((c) => c.id);

  // 2. Query Templates
  const templates = await prisma.template.findMany({
    where: {
      conceptKey: { in: conceptCodes },
      isActive: true,
      deletedAt: null,
    },
  });

  console.log("🤖 Active AI Templates found:");
  if (templates.length === 0) {
    console.log("  (None)");
  } else {
    templates.forEach((t) => {
      console.log(`  - Name: "${t.name}", Difficulty: "${t.difficultyLevel}"`);
    });
  }
  console.log("\n");

  // 3. Query Manual Questions
  const questions = await prisma.question.findMany({
    where: {
      conceptId: { in: conceptIds },
      status: "ACTIVE",
    },
  });

  console.log("✍️ Active Manual Questions found:");
  if (questions.length === 0) {
    console.log("  (None)");
  } else {
    // Group by difficulty
    const counts: Record<string, number> = {};
    questions.forEach((q) => {
      counts[q.difficulty] = (counts[q.difficulty] || 0) + 1;
    });
    Object.entries(counts).forEach(([diff, count]) => {
      console.log(`  - Difficulty "${diff}": ${count} questions`);
    });
  }

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
});
