import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating Plan limitations: Removing allowed_formats & seats, adding specific assessment assignment...');

  // 1. Delete old allowed_formats and seats features from all plans
  const deleted = await prisma.planFeature.deleteMany({
    where: {
      featureKey: { in: ['allowed_formats', 'seats'] },
    },
  });
  console.log(`Deleted ${deleted.count} obsolete limitation records (allowed_formats, seats).`);

  // 2. Fetch plans
  const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } });
  const proPlan = await prisma.plan.findUnique({ where: { slug: 'pro' } });
  const teamsPlan = await prisma.plan.findUnique({ where: { slug: 'teams' } });

  // 3. Add allowed_assessments to Free Plan
  if (freePlan) {
    await prisma.planFeature.upsert({
      where: { planId_featureKey: { planId: freePlan.id, featureKey: 'allowed_assessments' } },
      create: {
        planId: freePlan.id,
        featureKey: 'allowed_assessments',
        featureName: 'Specific Assigned Assessments',
        valueType: 'ARRAY',
        valueJson: ['assigned_only'],
        description: 'Candidate can access specific assessments assigned to their profile or free tier',
        sortOrder: 2,
      },
      update: {
        featureName: 'Specific Assigned Assessments',
        valueType: 'ARRAY',
        valueJson: ['assigned_only'],
        description: 'Candidate can access specific assessments assigned to their profile or free tier',
        sortOrder: 2,
      },
    });
    console.log('Added allowed_assessments to Free Plan.');
  }

  // 4. Add allowed_assessments to Pro Plan
  if (proPlan) {
    await prisma.planFeature.upsert({
      where: { planId_featureKey: { planId: proPlan.id, featureKey: 'allowed_assessments' } },
      create: {
        planId: proPlan.id,
        featureKey: 'allowed_assessments',
        featureName: 'All System Assessments Access',
        valueType: 'ARRAY',
        valueJson: ['all'],
        description: 'Full unlimited access to all active assessment blueprints and question pools',
        sortOrder: 2,
      },
      update: {
        featureName: 'All System Assessments Access',
        valueType: 'ARRAY',
        valueJson: ['all'],
        description: 'Full unlimited access to all active assessment blueprints and question pools',
        sortOrder: 2,
      },
    });
    console.log('Added allowed_assessments to Pro Plan.');
  }

  // 5. Add allowed_assessments to Teams Plan
  if (teamsPlan) {
    await prisma.planFeature.upsert({
      where: { planId_featureKey: { planId: teamsPlan.id, featureKey: 'allowed_assessments' } },
      create: {
        planId: teamsPlan.id,
        featureKey: 'allowed_assessments',
        featureName: 'All System Assessments & Custom Tracks',
        valueType: 'ARRAY',
        valueJson: ['all'],
        description: 'Full access to all assessments plus custom corporate question tracks',
        sortOrder: 2,
      },
      update: {
        featureName: 'All System Assessments & Custom Tracks',
        valueType: 'ARRAY',
        valueJson: ['all'],
        description: 'Full access to all assessments plus custom corporate question tracks',
        sortOrder: 2,
      },
    });
    console.log('Added allowed_assessments to Teams Plan.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
