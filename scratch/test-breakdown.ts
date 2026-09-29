import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const configId = 'cmsifafam000099s9csfe33pg';
  const user = await prisma.user.findFirst();
  const userId = user!.id;

  console.log('Testing step by step latency for candidate test start...');

  // Step 1: User lookup
  const t0 = Date.now();
  await prisma.user.findUnique({ where: { id: userId } });
  console.log(`User.findUnique: ${Date.now() - t0}ms`);

  // Step 2: ExamConfig in eligibility
  const t1 = Date.now();
  await prisma.testConfig.findUnique({ where: { id: configId } }).catch(() => null);
  console.log(`TestConfig.findUnique (miss): ${Date.now() - t1}ms`);

  const t2 = Date.now();
  await prisma.examConfig.findUnique({
    where: { id: configId },
    include: { ruleFlags: true },
  });
  console.log(`ExamConfig.findUnique: ${Date.now() - t2}ms`);

  // Step 3: Active test check
  const t3 = Date.now();
  await prisma.testInstance.findFirst({
    where: {
      userId,
      examConfigId: configId,
      status: { in: ['CREATED', 'IN_PROGRESS', 'ADMIN_REVIEW', 'RESUME_AUTHORIZED', 'RESUMED', 'AUTO_SUBMITTED'] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  console.log(`Active test check: ${Date.now() - t3}ms`);

  // Step 4: ExamConfig with sections & blueprint
  const t4 = Date.now();
  await prisma.examConfig.findUnique({
    where: { id: configId },
    include: {
      sections: { orderBy: { sectionOrder: 'asc' } },
      blueprint: true,
      ruleFlags: true,
    },
  });
  console.log(`ExamConfig with sections & blueprint: ${Date.now() - t4}ms`);

  // Step 5: Previous attempts
  const t5 = Date.now();
  await prisma.testInstance.findMany({
    where: {
      userId,
      OR: [{ examConfigId: configId }, { testConfigId: configId }],
      status: { in: ['SUBMITTED', 'COMPLETED'] },
    },
  });
  console.log(`Previous attempts: ${Date.now() - t5}ms`);

  // Step 6: findLatestReusableByConfigId
  const t6 = Date.now();
  const a = await prisma.assembledTest.findFirst({
    where: {
      configId,
      totalQuestions: { gt: 0 },
      status: { in: ['PUBLISHED', 'DRAFT'] },
      sections: {
        some: { questions: { some: {} } },
        none: { questions: { none: {} } },
      },
    },
    select: {
      id: true,
      configId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      examConfig: { select: { updatedAt: true, ruleFlags: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log(`findLatestReusableByConfigId: ${Date.now() - t6}ms, id:`, a?.id);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
