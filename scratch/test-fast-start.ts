import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

// In-memory caches simulating the optimization
const configCache = new Map<string, any>();
const reusableCache = new Map<string, any>();

async function getCachedExamConfig(configId: string) {
  if (configCache.has(configId)) {
    return configCache.get(configId);
  }
  const config = await prisma.examConfig.findUnique({
    where: { id: configId },
    include: {
      sections: { orderBy: { sectionOrder: 'asc' } },
      blueprint: true,
      ruleFlags: true,
    },
  });
  configCache.set(configId, config);
  return config;
}

async function getCachedReusable(configId: string) {
  if (reusableCache.has(configId)) {
    return reusableCache.get(configId);
  }
  const assembly = await prisma.assembledTest.findFirst({
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
  if (!assembly) return null;
  const full = await prisma.assembledTest.findUnique({
    where: { id: assembly.id },
    include: {
      sections: {
        include: {
          questions: { orderBy: { questionOrder: 'asc' } },
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  });
  reusableCache.set(configId, full);
  return full;
}

async function simulateCandidateStart(candidateIndex: number) {
  const t0 = Date.now();
  const configId = 'cmsifafam000099s9csfe33pg';
  const user = await prisma.user.findFirst();
  const userId = user!.id;

  // 1. Get cached config & reusable
  const config = await getCachedExamConfig(configId);
  const reusable = await getCachedReusable(configId);

  // 2. Active test check (only 1 read query!)
  const activeTest = await prisma.testInstance.findFirst({
    where: {
      userId,
      examConfigId: configId,
      status: { in: ['IN_PROGRESS', 'RESUMED'] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true },
  });

  if (activeTest) {
    return { testInstanceId: activeTest.id, status: 'IN_PROGRESS', duration: Date.now() - t0 };
  }

  // 3. Batch clone transaction (only 1 transaction!)
  const testInstanceId = createId();
  const expiresAt = new Date(Date.now() + 7800 * 1000);

  const sectionRows: any[] = [];
  const questionRows: any[] = [];

  for (let i = 0; i < reusable.sections.length; i++) {
    const sec = reusable.sections[i];
    const instanceSectionId = createId();

    sectionRows.push({
      id: instanceSectionId,
      testInstanceId,
      sectionKey: sec.sectionKey || `section_${i + 1}`,
      sectionName: sec.sectionName || `Section ${i + 1}`,
      durationSeconds: sec.durationSeconds,
      questionCount: sec.questionCount || sec.questions?.length || 0,
      orderIndex: i,
      status: i === 0 ? 'ACTIVE' : 'UPCOMING',
    });

    for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
      const q = sec.questions[qIdx];
      questionRows.push({
        testInstanceId,
        sectionId: instanceSectionId,
        questionId: q.questionId,
        questionOrder: qIdx,
        questionSnapshot: q.questionSnapshot || {},
      });
    }
  }

  const queries = [
    prisma.testInstance.create({
      data: {
        id: testInstanceId,
        userId,
        examConfigId: configId,
        status: 'CREATED',
        expiresAt,
      },
    }),
    prisma.testInstanceSection.createMany({ data: sectionRows }),
    prisma.testInstanceQuestion.createMany({ data: questionRows }),
    prisma.executionState.create({
      data: {
        testInstanceId,
        currentQuestionIndex: 0,
        currentSectionIndex: 0,
        currentSectionKey: reusable.sections[0]?.sectionKey || 'default',
        remainingTimeSeconds: 7800,
        lockedSectionKeys: [],
        markedQuestions: [],
        visitedQuestions: [],
      },
    }),
  ];

  await prisma.$transaction(queries);
  const dur = Date.now() - t0;

  // Clean up
  await prisma.testInstanceQuestion.deleteMany({ where: { testInstanceId } });
  await prisma.testInstanceSection.deleteMany({ where: { testInstanceId } });
  await prisma.executionState.deleteMany({ where: { testInstanceId } });
  await prisma.testInstance.delete({ where: { id: testInstanceId } });

  return { testInstanceId, status: 'CREATED', duration: dur };
}

async function run() {
  console.log('--- WARMING CACHE (Candidate 1) ---');
  const res1 = await simulateCandidateStart(1);
  console.log(`Candidate 1 (cold start): ${res1.duration}ms`);

  console.log('--- TESTING WARM CANDIDATES (Candidate 2, 3, 4) ---');
  const res2 = await simulateCandidateStart(2);
  console.log(`Candidate 2 (cached): ${res2.duration}ms`);
  const res3 = await simulateCandidateStart(3);
  console.log(`Candidate 3 (cached): ${res3.duration}ms`);
  const res4 = await simulateCandidateStart(4);
  console.log(`Candidate 4 (cached): ${res4.duration}ms`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
