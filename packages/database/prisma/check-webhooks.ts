import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const feat = await prisma.planFeature.findFirst({
    where: { featureKey: 'allowed_assessments' }
  });

  if (feat) {
    const val = feat.valueJson as any;
    const count = Array.isArray(val?.assessments) ? val.assessments.length : 2;
    const attempts = val?.overallAttempts ?? val?.attemptsPerExam ?? 2;
    await prisma.planFeature.update({
      where: { id: feat.id },
      data: {
        featureName: `${count} Specific Assigned Assessments (${attempts} Attempts Overall)`,
        valueJson: {
          ...val,
          overallAttempts: attempts,
          attemptsPerExam: attempts,
        }
      }
    });
    console.log(`Updated planFeature in DB to ${count} Specific Assigned Assessments (${attempts} Attempts Overall)!`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
