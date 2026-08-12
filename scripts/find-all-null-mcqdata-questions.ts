import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== INSPECTING ALL MCQ QUESTIONS FOR NULL MCQDATA ===");

  const nullMcqQuestions = await prisma.question.findMany({
    where: {
      questionType: { in: ["MCQ", "MULTIPLE_CHOICE"] },
      status: "ACTIVE",
      mcqData: { equals: null },
    },
    select: {
      id: true,
      questionText: true,
      questionType: true,
      difficulty: true,
      topicId: true,
    },
  });

  console.log(`Found ${nullMcqQuestions.length} Active MCQ Question(s) with mcqData = null in DB:`);
  for (const q of nullMcqQuestions) {
    console.log(`  - [${q.id}] (${q.difficulty}) ${q.questionText.substring(0, 60)}...`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
