import {
  connectPrisma,
  disconnectPrisma,
  prisma,
  ExecutionPersistenceRepository,
} from "../packages/database/src";
import { createId } from "@paralleldrive/cuid2";

async function run() {
  console.log("==========================================");
  console.log("Starting Autosave Engine Verification");
  console.log("==========================================\n");

  await connectPrisma();

  let dummyUserId: string | null = null;
  let testConfigId: string | null = null;
  let testInstanceId: string | null = null;

  try {
    const repo = new ExecutionPersistenceRepository(prisma);

    // 1. Setup User
    const user = await prisma.user.create({
      data: {
        email: `verify_autosave_user_${Date.now()}@example.com`,
        passwordHash: "dummyhash",
        fullName: "Autosave Candidate",
        role: "CANDIDATE",
      },
    });
    dummyUserId = user.id;

    // 2. Setup TestConfig
    const config = await prisma.testConfig.create({
      data: {
        configKey: `verify_autosave_cfg_${Date.now()}`,
        companyName: "Autosave Verification Inc",
        displayName: "Autosave Integration Test",
        totalDurationSeconds: 1200,
        totalQuestions: 2,
      },
    });
    testConfigId = config.id;

    // 3. Setup TestInstance
    testInstanceId = createId();
    await prisma.testInstance.create({
      data: {
        id: testInstanceId,
        userId: dummyUserId,
        testConfigId: config.id,
        status: "CREATED",
        expiresAt: new Date(Date.now() + 1000 * 1200),
      },
    });

    // 4. Trigger saveAnswerAndState
    const questionId = "q_autosave_01";
    console.log("Saving candidate answer and state...");
    await repo.saveAnswerAndState(
      {
        testInstanceId,
        questionId,
        answer: "option_b",
        timeSpentSeconds: 15,
        isMarkedForReview: true,
      },
      {
        testInstanceId,
        currentQuestionIndex: 1,
        remainingTimeSeconds: 1185,
      },
    );

    // 5. Verify persistence
    const savedAnswer = await prisma.candidateAnswer.findUnique({
      where: {
        testInstanceId_questionId: {
          testInstanceId,
          questionId,
        },
      },
    });

    const savedState = await prisma.executionState.findUnique({
      where: { testInstanceId },
    });

    if (!savedAnswer || savedAnswer.answer !== "option_b") {
      throw new Error("Validation Failed: Answer was not saved correctly");
    }

    if (
      !savedState ||
      savedState.currentQuestionIndex !== 1 ||
      savedState.remainingTimeSeconds !== 1185
    ) {
      throw new Error(
        "Validation Failed: Execution progress state was not saved correctly",
      );
    }

    console.log("✅ Autosave state persisted successfully.");
    console.log("✅ Progress indicators updated successfully.");

    console.log("\n==========================================");
    console.log("AUTOSAVE PASS");
    console.log("==========================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n==========================================");
    console.error("AUTOSAVE FAIL");
    console.error(err.message || err);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    // Cleanup
    if (testInstanceId) {
      await prisma.candidateAnswer
        .deleteMany({ where: { testInstanceId } })
        .catch(() => {});
      await prisma.executionState
        .deleteMany({ where: { testInstanceId } })
        .catch(() => {});
      await prisma.testInstance
        .delete({ where: { id: testInstanceId } })
        .catch(() => {});
    }
    if (testConfigId) {
      await prisma.testConfig
        .delete({ where: { id: testConfigId } })
        .catch(() => {});
    }
    if (dummyUserId) {
      await prisma.user.delete({ where: { id: dummyUserId } }).catch(() => {});
    }
    await disconnectPrisma();
  }
}

run();
