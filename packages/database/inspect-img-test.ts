const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const q = await prisma.question.findFirst({
    where: {
      questionText: { contains: 'alternating series' }
    },
    include: {
      template: true,
    }
  });

  console.log('=== QUESTION IN DB ===');
  console.log('id:', q?.id);
  console.log('text:', q?.questionText);
  console.log('attachments:', JSON.stringify(q?.attachments, null, 2));
  console.log('mcqData:', JSON.stringify(q?.mcqData, null, 2));
  console.log('template.config:', JSON.stringify(q?.template?.config, null, 2));

  // Find which test configs or exam configs use this question or its topic/concept
  const tiqs = await prisma.testInstanceQuestion.findMany({
    where: {
      questionId: q?.id
    },
    include: {
      testInstance: {
        include: {
          testConfig: true,
          examConfig: true,
        }
      }
    }
  });

  console.log('=== TEST INSTANCE QUESTIONS USING THIS QUESTION ===');
  for (const tiq of tiqs) {
    console.log(`TI ID: ${tiq.testInstanceId} | Config: ${tiq.testInstance?.testConfig?.displayName || tiq.testInstance?.examConfig?.name}`);
    console.log('TIQ questionSnapshot:', JSON.stringify(tiq.questionSnapshot, null, 2));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
