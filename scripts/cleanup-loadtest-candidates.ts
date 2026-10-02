import { prisma } from '../packages/database/src';

async function cleanupLoadtestCandidates() {
  console.log('Cleaning up loadtest candidates...');
  const testCandidates = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'skillitrix-loadtest.invalid' } },
        { email: { contains: 'qloax-cand' } },
        { email: { contains: 'soak-vu' } },
        { email: { contains: 'volume-vu' } },
        { email: { contains: 'day4-' } }
      ]
    },
    select: { id: true, email: true }
  });

  const ids = testCandidates.map(c => c.id);
  console.log(`Found ${ids.length} loadtest candidates to clean up.`);

  if (ids.length > 0) {
    await prisma.candidateAnswer.deleteMany({
      where: { testInstance: { userId: { in: ids } } }
    });
    await prisma.executionState.deleteMany({
      where: { testInstance: { userId: { in: ids } } }
    });
    await prisma.testInstanceSection.deleteMany({
      where: { testInstance: { userId: { in: ids } } }
    });
    await prisma.testInstanceQuestion.deleteMany({
      where: { testInstance: { userId: { in: ids } } }
    });
    await prisma.testInstance.deleteMany({
      where: { userId: { in: ids } }
    });
    await prisma.userQuotaOverride.deleteMany({
      where: { userId: { in: ids } }
    });
    await prisma.referralRedemption.deleteMany({
      where: { userId: { in: ids } }
    });
    await prisma.subscription.deleteMany({
      where: { userId: { in: ids } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: ids } }
    });
    console.log(`Successfully cleaned up ${ids.length} candidate records.`);
  }

  const remaining = await prisma.user.count();
  console.log(`Total real platform users preserved: ${remaining}`);
  await prisma.$disconnect();
}

cleanupLoadtestCandidates().catch(console.error);
