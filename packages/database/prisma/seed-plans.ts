import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding baseline subscription plans and real features...');

  // 1. Free Plan
  const freePlan = await prisma.plan.upsert({
    where: { slug: 'free' },
    create: {
      slug: 'free',
      name: 'Free',
      description: 'Essential practice tests and assessment scoring for individual learners.',
      priceMonthly: 0,
      currency: 'INR',
      isHighlighted: false,
      buttonText: 'Continue with Free',
      isActive: true,
      sortOrder: 1,
    },
    update: {
      name: 'Free',
      description: 'Essential practice tests and assessment scoring for individual learners.',
      priceMonthly: 0,
      buttonText: 'Continue with Free',
      isActive: true,
      sortOrder: 1,
    },
  });

  const freeFeatures = [
    { featureKey: 'monthly_rounds_limit', featureName: '3 Tests / Month', valueType: 'NUMBER', valueJson: 3, sortOrder: 1 },
    { featureKey: 'allowed_formats', featureName: 'Behavioral & Technical formats', valueType: 'ARRAY', valueJson: ['behavioral', 'technical'], sortOrder: 2 },
    { featureKey: 'detailed_analytics', featureName: 'Standard score summary', valueType: 'BOOLEAN', valueJson: false, sortOrder: 3 },
    { featureKey: 'history_limit', featureName: 'Last 3 test results history', valueType: 'NUMBER', valueJson: 3, sortOrder: 4 },
    { featureKey: 'seats', featureName: '1 Candidate account', valueType: 'NUMBER', valueJson: 1, sortOrder: 5 },
    { featureKey: 'support_tier', featureName: 'Community support', valueType: 'STRING', valueJson: 'community', sortOrder: 6 },
  ];

  for (const feat of freeFeatures) {
    await prisma.planFeature.upsert({
      where: { planId_featureKey: { planId: freePlan.id, featureKey: feat.featureKey } },
      create: { planId: freePlan.id, ...feat },
      update: { featureName: feat.featureName, valueType: feat.valueType, valueJson: feat.valueJson, sortOrder: feat.sortOrder },
    });
  }

  // 2. Pro Plan
  const proPlan = await prisma.plan.upsert({
    where: { slug: 'pro' },
    create: {
      slug: 'pro',
      name: 'Pro',
      description: 'Full assessment mastery with unlimited practice tests and detailed skill analytics.',
      priceMonthly: 240000, // ₹2,400 (~$29)
      currency: 'INR',
      badge: 'POPULAR',
      isHighlighted: true,
      buttonText: 'Upgrade to Pro',
      isActive: true,
      sortOrder: 2,
    },
    update: {
      name: 'Pro',
      description: 'Full assessment mastery with unlimited practice tests and detailed skill analytics.',
      priceMonthly: 240000,
      badge: 'POPULAR',
      isHighlighted: true,
      buttonText: 'Upgrade to Pro',
      isActive: true,
      sortOrder: 2,
    },
  });

  const proFeatures = [
    { featureKey: 'monthly_rounds_limit', featureName: 'Unlimited practice tests / month', valueType: 'NUMBER', valueJson: null, sortOrder: 1 },
    { featureKey: 'allowed_formats', featureName: 'All test formats & topics', valueType: 'ARRAY', valueJson: ['all'], sortOrder: 2 },
    { featureKey: 'detailed_analytics', featureName: 'Full skill mastery & score trends', valueType: 'BOOLEAN', valueJson: true, sortOrder: 3 },
    { featureKey: 'history_limit', featureName: 'Complete history of all attempts', valueType: 'NUMBER', valueJson: null, sortOrder: 4 },
    { featureKey: 'seats', featureName: '1 Candidate account', valueType: 'NUMBER', valueJson: 1, sortOrder: 5 },
    { featureKey: 'support_tier', featureName: 'Email support (1 business day)', valueType: 'STRING', valueJson: 'email_1bd', sortOrder: 6 },
  ];

  for (const feat of proFeatures) {
    await prisma.planFeature.upsert({
      where: { planId_featureKey: { planId: proPlan.id, featureKey: feat.featureKey } },
      create: { planId: proPlan.id, ...feat },
      update: { featureName: feat.featureName, valueType: feat.valueType, valueJson: feat.valueJson, sortOrder: feat.sortOrder },
    });
  }

  // 3. Teams Plan
  const teamsPlan = await prisma.plan.upsert({
    where: { slug: 'teams' },
    create: {
      slug: 'teams',
      name: 'Teams',
      description: 'For universities, bootcamps, and hiring cohorts needing collaborative analytics.',
      priceMonthly: 650000, // ₹6,500 (~$79)
      currency: 'INR',
      badge: 'FOR COHORTS',
      isHighlighted: false,
      buttonText: 'Talk to Us',
      isActive: true,
      sortOrder: 3,
    },
    update: {
      name: 'Teams',
      description: 'For universities, bootcamps, and hiring cohorts needing collaborative analytics.',
      priceMonthly: 650000,
      badge: 'FOR COHORTS',
      buttonText: 'Talk to Us',
      isActive: true,
      sortOrder: 3,
    },
  });

  const teamsFeatures = [
    { featureKey: 'monthly_rounds_limit', featureName: 'Unlimited tests for all members', valueType: 'NUMBER', valueJson: null, sortOrder: 1 },
    { featureKey: 'seats', featureName: 'Up to 25 seats with shared pool', valueType: 'NUMBER', valueJson: 25, sortOrder: 2 },
    { featureKey: 'detailed_analytics', featureName: 'Full candidate skill analytics', valueType: 'BOOLEAN', valueJson: true, sortOrder: 3 },
    { featureKey: 'cohort_dashboard', featureName: 'Cohort performance dashboard', valueType: 'BOOLEAN', valueJson: true, sortOrder: 4 },
    { featureKey: 'history_limit', featureName: 'Unlimited candidate attempt history', valueType: 'NUMBER', valueJson: null, sortOrder: 5 },
    { featureKey: 'support_tier', featureName: 'Dedicated named account contact', valueType: 'STRING', valueJson: 'named_contact', sortOrder: 6 },
  ];

  for (const feat of teamsFeatures) {
    await prisma.planFeature.upsert({
      where: { planId_featureKey: { planId: teamsPlan.id, featureKey: feat.featureKey } },
      create: { planId: teamsPlan.id, ...feat },
      update: { featureName: feat.featureName, valueType: feat.valueType, valueJson: feat.valueJson, sortOrder: feat.sortOrder },
    });
  }

  console.log('Successfully seeded plans and features!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
