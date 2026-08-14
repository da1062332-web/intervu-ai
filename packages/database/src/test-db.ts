import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
    try {
      const questions = await prisma.question.findMany({
        where: {
          questionText: { contains: "olleh", mode: "insensitive" }
        }
      });
  
      console.log(`Found ${questions.length} questions.`);
      for (const q of questions) {
        console.log(`Question ID: ${q.id}`);
        console.log(`Coding Data: ${JSON.stringify(q.codingData, null, 2)}`);
      }

      // If it's a testInstanceQuestion
      const tiqs = await prisma.testInstanceQuestion.findMany({
        where: {
          questionSnapshot: { path: ['questionText'], string_contains: "olleh" }
        }
      });
      console.log(`Found ${tiqs.length} test instance questions.`);
    } catch (e) {
      console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
