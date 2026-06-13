import { PrismaService } from "../apps/api/src/prisma/prisma.service";
import { EvaluationRepository } from "../apps/api/src/modules/results/repositories/evaluation.repository";
import { ResultsService } from "../apps/api/src/modules/results/services/results.service";
import { UnauthorizedResultAccessError } from "@intervu/shared";
import { createId } from "@paralleldrive/cuid2";

async function run() {
  console.log("==========================================");
  console.log("Starting Results Verification");
  console.log("==========================================\n");

  const prisma = new PrismaService();
  const evaluationRepository = new EvaluationRepository(prisma);
  const resultsService = new ResultsService(evaluationRepository);

  let userId: string | null = null;
  let templateId: string | null = null;
  let testId: string | null = null;
  let evaluationId: string | null = null;

  try {
    await prisma.$connect();

    // 1. Create User
    const user = await prisma.user.create({
      data: {
        email: `verify_res_${createId()}@example.com`,
        passwordHash: "dummyhash",
        fullName: "Results Candidate",
        role: "CANDIDATE",
      },
    });
    userId = user.id;

    // 2. Create Template
    const template = await prisma.template.create({
      data: {
        templateKey: `verify_res_tpl_${createId()}`,
        conceptKey: "results_concept",
        difficultyLevel: "MEDIUM",
        questionType: "mcq",
        name: "Results Integration Template",
      },
    });
    templateId = template.id;

    // 3. Create Test
    const test = await prisma.test.create({
      data: {
        userId: userId,
        templateId: templateId,
        status: "COMPLETED",
      },
    });
    testId = test.id;

    // 4. Create EvaluationResult with nested SkillScores
    const evaluation = await prisma.evaluationResult.create({
      data: {
        testId: testId,
        userId: userId,
        communicationScore: 80.0,
        technicalScore: 88.0,
        confidenceScore: 90.0,
        overallScore: 85.0,
        overallRating: 4.5,
        notes: "Excellent performance across categories",
        totalQuestions: 10,
        correctAnswers: 8,
        incorrectAnswers: 2,
        skillScores: {
          create: [
            {
              skill: "Problem Solving",
              score: 85.0,
              feedback: "Great analytical skills",
            },
            {
              skill: "Communication",
              score: 90.0,
              feedback: "Very articulate",
            },
          ],
        },
      },
    });
    evaluationId = evaluation.id;

    console.log(`Setup complete. User: ${userId}, Evaluation: ${evaluationId}`);

    // 5. Test getResultDetails for Authorized User
    console.log("Invoking resultsService.getResultDetails...");
    const result = await resultsService.getResultDetails(userId, evaluationId);

    // Assertions
    if (!result) {
      throw new Error("Result details not returned.");
    }
    console.log("Verifying overall score...");
    if (result.overallScore !== 85.0) {
      throw new Error(`Expected overallScore 85.0, got ${result.overallScore}`);
    }
    console.log("Verifying confidence score...");
    if (result.confidenceScore !== 90.0) {
      throw new Error(`Expected confidenceScore 90.0, got ${result.confidenceScore}`);
    }
    console.log("Verifying skill scores length...");
    if (result.skillScores.length !== 2) {
      throw new Error(`Expected 2 skill scores, got ${result.skillScores.length}`);
    }

    // Verify nested skill scores content
    const problemSolving = result.skillScores.find((s) => s.skill === "Problem Solving");
    if (!problemSolving || problemSolving.score !== 85.0 || problemSolving.feedback !== "Great analytical skills") {
      throw new Error("Problem Solving skill score mismatch");
    }

    const communication = result.skillScores.find((s) => s.skill === "Communication");
    if (!communication || communication.score !== 90.0 || communication.feedback !== "Very articulate") {
      throw new Error("Communication skill score mismatch");
    }

    console.log("Authorized access verification: PASS");

    // 6. Test Unauthorized Access
    console.log("Testing unauthorized access attempt...");
    const unauthorizedUserId = `unauth_${createId()}`;
    try {
      await resultsService.getResultDetails(unauthorizedUserId, evaluationId);
      throw new Error("Expected UnauthorizedResultAccessError but none was thrown");
    } catch (e: any) {
      if (e instanceof UnauthorizedResultAccessError || e.name === "UnauthorizedResultAccessError" || e.message?.includes("Unauthorized")) {
        console.log("Unauthorized access attempt correctly rejected.");
      } else {
        throw new Error(`Expected UnauthorizedResultAccessError, got: ${e.name || e.message || e}`);
      }
    }

    console.log("Unauthorized access verification: PASS");

    console.log("\n==========================================");
    console.log("RESULTS PASS");
    console.log("==========================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n==========================================");
    console.error("RESULTS FAIL");
    console.error(err.message || err);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    // Teardown
    console.log("Starting teardown...");
    if (evaluationId) {
      await prisma.skillScore.deleteMany({ where: { evaluationId } }).catch(() => {});
      await prisma.evaluationResult.delete({ where: { id: evaluationId } }).catch(() => {});
    }
    if (testId) {
      await prisma.test.delete({ where: { id: testId } }).catch(() => {});
    }
    if (templateId) {
      await prisma.template.delete({ where: { id: templateId } }).catch(() => {});
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

run();
