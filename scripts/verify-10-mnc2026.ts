import { prisma } from '../packages/database/src';

async function verifyMNC2026() {
  console.log('====================================================');
  console.log('Verifying 10-Candidate MNC2026 Coupon Test in DB');
  console.log('====================================================');

  const testCandidates = await prisma.user.findMany({
    where: {
      email: { contains: 'qloax-mnc2026' }
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true
    }
  });

  console.log(`\nFound ${testCandidates.length} test candidates in database.`);
  testCandidates.forEach((c, i) => {
    console.log(`  [${i + 1}] ID: ${c.id} | Email: ${c.email} | Role: ${c.role}`);
  });

  const testCandidateIds = testCandidates.map(c => c.id);

  // Check redemptions
  const redemptions = await prisma.referralRedemption.findMany({
    where: {
      userId: { in: testCandidateIds }
    },
    include: {
      code: true,
      campaign: true
    }
  });
  console.log(`\nReferral Redemptions recorded: ${redemptions.length} / ${testCandidates.length}`);
  redemptions.forEach((r, i) => {
    console.log(`  [${i + 1}] User: ${r.userId} | Code: ${r.code.code} | Campaign: ${r.campaign.name} | At: ${r.grantedAt}`);
  });

  // Check Quota Overrides
  const overrides = await prisma.userQuotaOverride.findMany({
    where: {
      userId: { in: testCandidateIds }
    }
  });
  console.log(`\nQuota Overrides created: ${overrides.length}`);
  const allowedAssessments = overrides.filter(o => o.featureKey === 'allowed_assessments');
  const bonusRounds = overrides.filter(o => o.featureKey === 'monthly_rounds_limit');
  console.log(`  - 'allowed_assessments' overrides: ${allowedAssessments.length}`);
  console.log(`  - 'monthly_rounds_limit' overrides: ${bonusRounds.length}`);

  // Check Test Instances
  const testInstances = await prisma.testInstance.findMany({
    where: {
      userId: { in: testCandidateIds }
    },
    select: {
      id: true,
      userId: true,
      status: true,
      testConfigId: true,
      createdAt: true
    }
  });
  console.log(`\nTest Instances created: ${testInstances.length}`);
  testInstances.forEach((ti, i) => {
    console.log(`  [${i + 1}] Instance ID: ${ti.id} | User: ${ti.userId} | Status: ${ti.status}`);
  });

  // Check Referral Code & Campaign counters
  const code = await prisma.referralCode.findFirst({
    where: { code: 'MNC2026' }
  });
  console.log(`\nMNC2026 Code usedCount: ${code?.usedCount}`);

  const campaign = await prisma.referralCampaign.findFirst({
    where: { id: 'cmupgbm1e1tolyqagkctwryi8' }
  });
  console.log(`Campaign totalRedemptionCount: ${campaign?.totalRedemptionCount}`);

  const totalUsers = await prisma.user.count();
  console.log(`\nTotal platform users in database: ${totalUsers}`);

  await prisma.$disconnect();
}

verifyMNC2026().catch(e => {
  console.error(e);
  process.exit(1);
});
