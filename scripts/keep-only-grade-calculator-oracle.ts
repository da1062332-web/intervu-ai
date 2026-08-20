import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function keepOnlyGradeCalculatorOracle() {
  console.log('Cleaning database: Removing all oracle records except BASIC_GRADE_CALCULATOR_ORACLE...');

  // Delete all CodingOracle records except BASIC_GRADE_CALCULATOR_ORACLE
  const deleteResult = await prisma.codingOracle.deleteMany({
    where: {
      key: {
        not: 'BASIC_GRADE_CALCULATOR_ORACLE',
      },
    },
  });

  console.log(`✅ Deleted ${deleteResult.count} obsolete oracle records.`);

  // Ensure BASIC_GRADE_CALCULATOR_ORACLE is seeded cleanly
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

  const count = await prisma.codingOracle.count();
  console.log(`✅ Remaining total Oracle DB records: ${count} (Only BASIC_GRADE_CALCULATOR_ORACLE: ${oracle.id})`);
}

keepOnlyGradeCalculatorOracle()
  .catch((e) => {
    console.error('❌ Error executing cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
