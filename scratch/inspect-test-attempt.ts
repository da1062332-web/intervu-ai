import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:MARVEL7ace%4077090@db.ayklmzeqfezrlbkdusqc.supabase.co:5432/postgres",
    },
  },
});

async function main() {
  console.log('--- INSPECTING TEST ATTEMPTS & EVALUATION RUNS ---');

  const attemptId = 'wurfablihqtln4fbi677172u';

  const specificAttempt = await prisma.testInstance.findFirst({
    where: { OR: [{ id: attemptId }, { id: { contains: 'wurfab' } }] },
    include: {
      candidateResult: true,
      evaluationResult: true,
      evaluationRuns: true,
      testConfig: true,
      examConfig: true,
    },
  });

  console.log('\n--- Specific Attempt Found ---');
  console.log(specificAttempt);

  const recentAttempts = await prisma.testInstance.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      candidateResult: true,
      evaluationResult: true,
      evaluationRuns: true,
    },
  });

  console.log('\n--- Recent 10 Attempts ---');
  for (const att of recentAttempts) {
    console.log({
      id: att.id,
      status: att.status,
      submittedAt: att.submittedAt,
      hasResult: !!att.candidateResult,
      evalRuns: att.evaluationRuns,
    });
  }

  const evalRuns = await prisma.evaluationRun.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n--- Recent Evaluation Runs ---');
  console.dir(evalRuns, { depth: null });



  await prisma.$disconnect();
}

main().catch(console.error);
