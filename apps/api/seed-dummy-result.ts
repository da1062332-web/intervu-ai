import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const candidateId = "cmqmbucv00006mo2onh92e3gl";

  console.log("Seeding dummy result for candidate:", candidateId);

  // 1. Ensure user exists (if not, we might fail due to FK)
  let user = await prisma.user.findUnique({ where: { id: candidateId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: candidateId,
        email: `dummy-${Date.now()}@example.com`,
        passwordHash: "dummy",
        fullName: "Dummy Candidate",
        role: "CANDIDATE",
      }
    });
  }

  // 2. Create a TestConfig
  const testConfig = await prisma.testConfig.create({
    data: {
      configKey: `dummy-config-${Date.now()}`,
      companyName: "InterVu Dummy",
      displayName: "Dummy Assessment Test",
      totalDurationSeconds: 3600,
      totalQuestions: 10,
    }
  });

  // 3. Create a TestInstance
  const testInstance = await prisma.testInstance.create({
    data: {
      userId: user.id,
      testConfigId: testConfig.id,
      status: "COMPLETED",
      submittedAt: new Date(),
    }
  });

  // 4. Create the CandidateResult
  const candidateResult = await prisma.candidateResult.create({
    data: {
      candidateId: user.id,
      attemptId: testInstance.id,
      score: 85.5,
      percentage: 85.5,
    }
  });

  // 5. Create some evaluation analytics
  await prisma.evaluationAnalytics.create({
    data: {
      attemptId: testInstance.id,
      topicAccuracy: { "React": 90, "Node.js": 80 },
      difficultyAccuracy: { "EASY": 100, "MEDIUM": 80, "HARD": 70 },
      sectionAccuracy: { "Frontend": 90, "Backend": 80 },
      completionRate: 100,
      attemptRate: 100,
    }
  });

  console.log("Successfully created dummy result:", candidateResult.id);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
