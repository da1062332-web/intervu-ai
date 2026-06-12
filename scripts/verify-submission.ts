import {
  connectPrisma,
  disconnectPrisma,
  prisma,
  ExecutionPersistenceRepository,
  SubmissionRepository,
} from "../packages/database/src";
import { AnswerPersistenceService } from "../apps/api/src/modules/execution/answer-persistence.service";
import { createId } from "@paralleldrive/cuid2";

async function run() {
  console.log("==========================================");
  console.log("Starting Submission Lock Verification");
  console.log("==========================================\n");

  await connectPrisma();

  let dummyUserId: string | null = null;
  let testConfigId: string | null = null;
  let testInstanceId: string | null = null;

  try {
    const executionPersistenceRepo = new ExecutionPersistenceRepository(prisma);
    const submissionRepo = new SubmissionRepository(prisma);
    const service = new AnswerPersistenceService(executionPersistenceRepo, submissionRepo);

    // 1. Setup User
    const user = await prisma.user.create({
      data: {
        email: `verify_sub_user_${Date.now()}@example.com`,
        passwordHash: "dummyhash",
        fullName: "Submission Candidate",
        role: "CANDIDATE",
      },
    });
    dummyUserId = user.id;

    // 2. Setup TestConfig
    const config = await prisma.testConfig.create({
      data: {
        configKey: `verify_sub_cfg_${Date.now()}`,
        companyName: "Submission Verification Inc",
        displayName: "Submission Integration Test",
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
        status: "SUBMITTED",
        expiresAt: new Date(Date.now() + 1000 * 1200),
      },
    });

    // 4. Setup Submission record with SUBMITTED status
    await prisma.submission.create({
      data: {
        testInstanceId,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    // 5. Attempt modification -> Expect rejection
    console.log("Attempting answer update on submitted assessment...");
    let caughtLockException = false;
    try {
      await service.saveCandidateAnswer(
        testInstanceId,
        "q_sub_01",
        "attempted_change_value",
        0,
        1200
      );
    } catch (err: any) {
      if (err.message === "ANSWER_MODIFICATION_NOT_ALLOWED") {
        caughtLockException = true;
      } else {
        console.error("Unexpected error caught:", err);
      }
    }

    if (caughtLockException) {
      console.log("✅ Submission lock verified: DB write was blocked.");
    } else {
      throw new Error("Validation Failed: Answer update was allowed on a submitted assessment");
    }

    console.log("\n==========================================");
    console.log("SUBMISSION LOCK PASS");
    console.log("==========================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n==========================================");
    console.error("SUBMISSION LOCK FAIL");
    console.error(err.message || err);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    // Cleanup
    if (testInstanceId) {
      await prisma.candidateAnswer.deleteMany({ where: { testInstanceId } }).catch(() => {});
      await prisma.submission.deleteMany({ where: { testInstanceId } }).catch(() => {});
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
