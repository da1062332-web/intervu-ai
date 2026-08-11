import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- Setting up Test Data ---');
  // 1. Create a mock user
  const user = await prisma.user.create({
    data: {
      email: `test-candidate-${Date.now()}@example.com`,
      fullName: 'Test Candidate',
      role: 'CANDIDATE',
    }
  });

  // 2. Create 3 ExamConfigs: DRAFT, VALIDATED, PUBLISHED
  const common = { isActive: true, durationMinutes: 60, role: 'developer', totalQuestions: 10 };
  const draftConfig = await prisma.examConfig.create({
    data: { ...common, name: 'Draft Test', status: 'DRAFT', code: `DRAFT-${Date.now()}` }
  });
  const validatedConfig = await prisma.examConfig.create({
    data: { ...common, name: 'Validated Test', status: 'VALIDATED', code: `VAL-${Date.now()}` }
  });
  const publishedConfig = await prisma.examConfig.create({
    data: { ...common, name: 'Published Test', status: 'PUBLISHED', code: `PUB-${Date.now()}` }
  });

  console.log(`Created DRAFT: ${draftConfig.id}`);
  console.log(`Created VALIDATED: ${validatedConfig.id}`);
  console.log(`Created PUBLISHED: ${publishedConfig.id}`);

  console.log('\n--- Checking Queries ---');

  // Candidate Dashboard available exams query simulation:
  const dashboardConfigs = await prisma.examConfig.findMany({
    where: {
      isArchived: false,
      isActive: true,
      status: "PUBLISHED", // <--- THE FIX
      OR: [
        { enrollments: { some: { candidateId: user.id, status: { notIn: ["COMPLETED"] } } } },
        { enrollments: { none: {} } }
      ]
    },
    select: { id: true, name: true, status: true }
  });
  
  const availableExams = dashboardConfigs.filter((t: any) => 
    t.id === draftConfig.id || t.id === validatedConfig.id || t.id === publishedConfig.id
  );
  console.log('Dashboard Available Tests Found:', availableExams);

  // Public Catalog query simulation:
  const catalogExams = await prisma.examConfig.findMany({
    where: {
      isArchived: false,
      isActive: true,
      status: "PUBLISHED", // <--- THE FIX
      id: { in: [draftConfig.id, validatedConfig.id, publishedConfig.id] }
    },
    select: { id: true, name: true, status: true }
  });
  console.log('Catalog Tests Found:', catalogExams);

  // Eligibility Check simulation
  const checkEligibility = async (configId: string) => {
    const config = await prisma.examConfig.findUnique({
      where: { id: configId },
      select: { id: true, status: true }
    });
    if (!config) return 'NOT_FOUND';
    if (config.status !== "PUBLISHED") {
      return 'REJECTED: NOT PUBLISHED';
    }
    return 'ELIGIBLE';
  };

  console.log(`Draft Eligibility:`, await checkEligibility(draftConfig.id));
  console.log(`Validated Eligibility:`, await checkEligibility(validatedConfig.id));
  console.log(`Published Eligibility:`, await checkEligibility(publishedConfig.id));

  // Cleanup
  console.log('\n--- Cleaning up ---');
  await prisma.examConfig.deleteMany({
    where: { id: { in: [draftConfig.id, validatedConfig.id, publishedConfig.id] } }
  });
  await prisma.user.delete({ where: { id: user.id } });
}

run().catch(console.error).finally(() => prisma.$disconnect());
