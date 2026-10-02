import { prisma } from '../packages/database/src';

async function cleanupMNC2026() {
  console.log('Cleaning up 10 test candidates...');
  const testCandidates = await prisma.user.findMany({
    where: {
      email: { contains: 'qloax-mnc2026' }
    },
    select: { id: true }
  });

  const ids = testCandidates.map(c => c.id);
  console.log(`Found ${ids.length} test candidates to clean up.`);

  if (ids.length > 0) {
    // Delete test instances, answers, overrides, redemptions, subscriptions
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
    console.log(`Successfully removed ${ids.length} test candidate records.`);
  }

  // Reset coupon counts
  await prisma.referralCode.update({
    where: { code: 'MNC2026' },
    data: { usedCount: 0 }
  });
  await prisma.referralCampaign.update({
    where: { id: 'cmupgbm1e1tolyqagkctwryi8' },
    data: { totalRedemptionCount: 0 }
  });
  console.log('MNC2026 usedCount and Campaign totalRedemptionCount reset to 0.');

  const totalUsers = await prisma.user.count();
  console.log(`Total platform users remaining: ${totalUsers}`);

  await prisma.$disconnect();
}

cleanupMNC2026().catch(console.error);
