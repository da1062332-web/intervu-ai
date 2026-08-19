import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("--- VERIFYING PUBLISH FLOW ---");

  const gqs = await prisma.generatedQuestion.findMany();
  console.log(`Found ${gqs.length} GeneratedQuestion records.`);

  for (const gq of gqs) {
    const mainQ = await prisma.question.findFirst({
      where: {
        OR: [{ questionText: gq.questionText }, { id: gq.id }],
      },
      include: { topic: true },
    });

    console.log(`\nGeneratedQuestion ID: ${gq.id}`);
    console.log(`  conceptKey: ${gq.conceptKey}`);
    console.log(`  metadata.status: ${(gq.metadata as any)?.status}`);
    if (mainQ) {
      console.log(
        `  Question Table Record: ID = ${mainQ.id}, topicId = ${mainQ.topicId}, topicName = ${mainQ.topic?.name}, status = ${mainQ.status}`,
      );
    } else {
      console.log(`  Question Table Record: MISSING!`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
