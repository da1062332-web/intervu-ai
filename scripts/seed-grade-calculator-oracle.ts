import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGradeCalculatorOracle() {
  console.log('Seeding BASIC_GRADE_CALCULATOR_ORACLE into database...');

  let attempts = 0;
  while (attempts < 5) {
    try {
      attempts++;
      const oracle = await prisma.codingOracle.upsert({
        where: { key: 'BASIC_GRADE_CALCULATOR_ORACLE' },
        update: {
          name: 'Basic Grade Calculator',
          category: 'BASIC',
          description: 'Calculates a student\'s grade from marks using configurable grading thresholds.',
          supportedDifficulties: ['EASY'],
          parameterSchema: {
            marks: { type: 'integer', min: 0, max: 100, default: 85 },
            aThreshold: { type: 'integer', min: 0, max: 100, default: 90 },
            bThreshold: { type: 'integer', min: 0, max: 100, default: 80 },
            cThreshold: { type: 'integer', min: 0, max: 100, default: 70 },
            dThreshold: { type: 'integer', min: 0, max: 100, default: 60 },
          },
          isActive: true,
          isSystem: true,
          version: 1,
        },
        create: {
          key: 'BASIC_GRADE_CALCULATOR_ORACLE',
          name: 'Basic Grade Calculator',
          category: 'BASIC',
          description: 'Calculates a student\'s grade from marks using configurable grading thresholds.',
          supportedDifficulties: ['EASY'],
          parameterSchema: {
            marks: { type: 'integer', min: 0, max: 100, default: 85 },
            aThreshold: { type: 'integer', min: 0, max: 100, default: 90 },
            bThreshold: { type: 'integer', min: 0, max: 100, default: 80 },
            cThreshold: { type: 'integer', min: 0, max: 100, default: 70 },
            dThreshold: { type: 'integer', min: 0, max: 100, default: 60 },
          },
          isActive: true,
          isSystem: true,
          version: 1,
        },
      });

      console.log('✅ Successfully seeded BASIC_GRADE_CALCULATOR_ORACLE with ID:', oracle.id);
      return;
    } catch (err) {
      if (attempts >= 5) throw err;
      console.log(`Connection attempt ${attempts} failed, retrying in 2 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

seedGradeCalculatorOracle()
  .catch((e) => {
    console.error('❌ Error seeding BASIC_GRADE_CALCULATOR_ORACLE:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
