import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:MARVEL7ace%4077090@db.ayklmzeqfezrlbkdusqc.supabase.co:5432/postgres",
    },
  },
});

async function main() {
  console.log(
    "--- CHECKING UNCREATED APPROVED/PUBLISHED GENERATED QUESTIONS ---",
  );

  const generatedQuestions = await prisma.generatedQuestion.findMany();
  console.log(`Total Generated Questions: ${generatedQuestions.length}`);

  let approvedCount = 0;
  let publishedCount = 0;
  let missingInQuestionTable = 0;

  for (const gq of generatedQuestions) {
    const meta = (gq.metadata as any) || {};
    const status = meta.status;

    if (status === "APPROVED" || status === "PUBLISHED") {
      if (status === "APPROVED") approvedCount++;
      if (status === "PUBLISHED") publishedCount++;

      // Check if present in Question table
      const inMainTable = await prisma.question.findFirst({
        where: {
          OR: [{ questionText: gq.questionText }, { id: gq.id }],
        },
      });

      if (!inMainTable) {
        missingInQuestionTable++;
        console.log(`\nMISSING QUESTION (id: ${gq.id}):`);
        console.log(`  conceptKey: ${gq.conceptKey}`);
        console.log(`  status: ${status}`);
        console.log(`  questionText: ${gq.questionText.substring(0, 60)}...`);
      }
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Approved: ${approvedCount}`);
  console.log(`  Published: ${publishedCount}`);
  console.log(`  Missing in 'Question' DB table: ${missingInQuestionTable}`);

  await prisma.$disconnect();
}

main().catch(console.error);
