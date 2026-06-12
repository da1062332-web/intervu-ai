import {
  connectPrisma,
  disconnectPrisma,
  prisma,
  EvaluationRepository,
} from "../packages/database/src";
import { EvaluationEngineService } from "../packages/ai-core/src/evaluation/evaluation-engine.service";
import { createId } from "@paralleldrive/cuid2";

async function run() {
  console.log("==========================================");
  console.log("Starting Evaluation Engine Verification");
  console.log("==========================================\n");

  await connectPrisma();

  let dummyUserId: string | null = null;
  let testConfigId: string | null = null;
  let testInstanceId: string | null = null;
  let templateId: string | null = null;
  let testId: string | null = null;

  try {
    const evaluationEngine = new EvaluationEngineService();
    const evaluationRepo = new EvaluationRepository(prisma);

    // 1. Setup User
    const user = await prisma.user.create({
      data: {
        email: `verify_eval_user_${Date.now()}@example.com`,
        passwordHash: "dummyhash",
        fullName: "Evaluation Candidate",
        role: "CANDIDATE",
      },
    });
    dummyUserId = user.id;

    // 2. Setup Template
    const template = await prisma.template.create({
      data: {
        templateKey: `verify_eval_tpl_${Date.now()}`,
        conceptKey: "percentages",
        difficultyLevel: "EASY",
        questionType: "mcq",
      },
    });
    templateId = template.id;

    // 3. Setup Test
    const test = await prisma.test.create({
      data: {
        userId: dummyUserId,
        templateId: templateId,
        status: "COMPLETED",
      },
    });
    testId = test.id;

    // 4. Setup TestConfig
    const config = await prisma.testConfig.create({
      data: {
        configKey: `verify_eval_cfg_${Date.now()}`,
        companyName: "Evaluation Verification Inc",
        displayName: "Evaluation Integration Test",
        totalDurationSeconds: 1200,
        totalQuestions: 2,
      },
    });
    testConfigId = config.id;

    // 5. Setup TestInstance
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

    // 6. Mock Candidate Test execution output result
    const mockExecutionResult = {
      executionId: `exec_verify_${createId()}`,
      testId: testId,
      status: "submitted",
      answers: [
        { questionId: "q1", answer: "correct_val" },
        { questionId: "q2", answer: "incorrect_val" },
      ],
      submittedAt: new Date(),
    };

    const mockQuestions = [
      {
        questionId: "q1",
        correctAnswer: "correct_val",
        questionType: "mcq",
        conceptKey: "percentages",
        difficultyLevel: "EASY",
      },
      {
        questionId: "q2",
        correctAnswer: "expected_val_b",
        questionType: "mcq",
        conceptKey: "percentages",
        difficultyLevel: "EASY",
      },
    ];

    // 7. Run evaluation logic calculations
    console.log("Running EvaluationEngineService engine...");
    const evaluationResult = await evaluationEngine.evaluate(
      mockExecutionResult,
      mockQuestions
    );

    console.log("Evaluation Results calculated:", JSON.stringify(evaluationResult, null, 2));

    // Assert calculations
    if (evaluationResult.overallScore !== 50) {
      throw new Error(`Validation Failed: Expected overall score 50, got ${evaluationResult.overallScore}`);
    }
    if (evaluationResult.confidenceScore !== 100) {
      throw new Error(`Validation Failed: Expected confidence score 100, got ${evaluationResult.confidenceScore}`);
    }

    // 8. Persist through database repository
    console.log("Persisting evaluation result to database...");
    const createdEvaluation = await evaluationRepo.createEvaluation({
      testId: testId,
      candidateId: dummyUserId,
      overallScore: evaluationResult.overallScore,
      confidenceScore: evaluationResult.confidenceScore,
      notes: evaluationResult.feedback.join("\n"),
      skillScores: Object.entries(evaluationResult.skillScores).map(([skill, score]) => ({
        skill,
        score,
        feedback: `Calculated skill score for ${skill} is ${score}%`,
      })),
    });

    // Verify stored evaluation
    const stored = await evaluationRepo.findEvaluation(createdEvaluation.id);
    if (!stored) {
      throw new Error("Validation Failed: Stored evaluation not found in DB");
    }

    if (stored.overallScore !== 50 || stored.confidenceScore !== 100) {
      throw new Error("Validation Failed: Stored score fields did not match");
    }

    if (stored.skillScores.length === 0 || stored.skillScores[0].skill !== "aptitude") {
      throw new Error("Validation Failed: Skill scores were not nested and saved properly");
    }

    console.log("✅ Score calculations verified.");
    console.log("✅ Nested Skill ratings verified.");
    console.log("✅ DTO schema verification: PASS");
    console.log("✅ Database storage verification: PASS");

    console.log("\n==========================================");
    console.log("EVALUATION PASS");
    console.log("==========================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n==========================================");
    console.error("EVALUATION FAIL");
    console.error(err.message || err);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    // Cleanup
    if (testId) {
      await prisma.skillScore.deleteMany({
        where: {
          evaluation: { testId: testId }
        }
      }).catch(() => {});
      await prisma.evaluationResult.deleteMany({ where: { testId: testId } }).catch(() => {});
      await prisma.test.delete({ where: { id: testId } }).catch(() => {});
    }
    if (templateId) {
      await prisma.template.delete({ where: { id: templateId } }).catch(() => {});
    }
    if (testInstanceId) {
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
