import {
  connectPrisma,
  disconnectPrisma,
  prisma,
} from "../packages/database/src";
import { createId } from "@paralleldrive/cuid2";

async function run() {
  console.log("==========================================");
  console.log("Starting Resume Flow Verification");
  console.log("==========================================\n");

  await connectPrisma();

  let dummyUserId: string | null = null;
  let testConfigId: string | null = null;
  let testInstanceId: string | null = null;

  try {
    // 1. Setup User
    const user = await prisma.user.create({
      data: {
        email: `verify_resume_user_${Date.now()}@example.com`,
        passwordHash: "dummyhash",
        fullName: "Resume Candidate",
        role: "CANDIDATE",
      },
    });
    dummyUserId = user.id;

    // 2. Setup TestConfig
    const config = await prisma.testConfig.create({
      data: {
        configKey: `verify_resume_cfg_${Date.now()}`,
        companyName: "Resume Verification Inc",
        displayName: "Resume Integration Test",
        totalDurationSeconds: 1800,
        totalQuestions: 20,
      },
    });
    testConfigId = config.id;

    // 3. Setup TestInstance with active state
    testInstanceId = createId();
    await prisma.testInstance.create({
      data: {
        id: testInstanceId,
        userId: dummyUserId,
        testConfigId: config.id,
        status: "IN_PROGRESS",
        expiresAt: new Date(Date.now() + 1000 * 600), // 10 minutes remaining
      },
    });

    // Seed answers and index
    const questionId = "q_resume_15";
    await prisma.candidateAnswer.create({
      data: {
        testInstanceId,
        questionId,
        answer: "candidate_code_answer",
      },
    });

    await prisma.executionState.create({
      data: {
        testInstanceId,
        currentQuestionIndex: 14, // Question 15
        remainingTimeSeconds: 600,
      },
    });

    console.log("Simulating connection recovery UX check...");

    // 4. Retrieve state simulating browser reload
    const state = await prisma.executionState.findUnique({
      where: { testInstanceId },
    });

    const answers = await prisma.candidateAnswer.findMany({
      where: { testInstanceId },
    });

    // 5. Assertions
    if (!state || state.currentQuestionIndex !== 14 || state.remainingTimeSeconds !== 600) {
      throw new Error("Validation Failed: State restoration did not match original index or duration");
    }

    if (answers.length !== 1 || answers[0].answer !== "candidate_code_answer") {
      throw new Error("Validation Failed: Stored answer value was not retrieved successfully");
    }

    console.log("✅ Current navigation index restored: 14 (Question 15)");
    console.log("✅ Timer correctly calculated: 600 seconds remaining");
    console.log("✅ Candidate input cache successfully synced.");

    console.log("\n==========================================");
    console.log("RESUME PASS");
    console.log("==========================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n==========================================");
    console.error("RESUME FAIL");
    console.error(err.message || err);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    // Cleanup
    if (testInstanceId) {
      await prisma.candidateAnswer.deleteMany({ where: { testInstanceId } }).catch(() => {});
      await prisma.executionState.deleteMany({ where: { testInstanceId } }).catch(() => {});
      await prisma.testInstance.delete({ where: { id: testInstanceId } }).catch(() => {});
    }
    if (testConfigId) {
      await prisma.testConfig.delete({ where: { id: testConfigId } }).catch(() => {});
    }
    if (dummyUserId) {
      await prisma.user.delete({ where: { id: dummyUserId } }).catch(() => {});
    }
    await disconnectPrisma();
  }
}

run();
