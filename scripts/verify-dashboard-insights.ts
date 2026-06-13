import { PrismaService } from "../apps/api/src/prisma/prisma.service";
import { EvaluationRepository } from "../apps/api/src/modules/results/repositories/evaluation.repository";
import { PerformanceRepository } from "../apps/api/src/modules/results/repositories/performance.repository";
import { PerformanceService } from "../apps/api/src/modules/results/services/performance.service";
import { createId } from "@paralleldrive/cuid2";

async function run() {
  console.log("==========================================");
  console.log("Starting Dashboard Insights Verification");
  console.log("==========================================\n");

  const prisma = new PrismaService();
  const evaluationRepository = new EvaluationRepository(prisma);
  const performanceRepository = new PerformanceRepository(prisma);
  const performanceService = new PerformanceService(
    performanceRepository,
    evaluationRepository,
  );

  let userId: string | null = null;
  const templateIds: string[] = [];
  const testIds: string[] = [];
  const evaluationIds: string[] = [];

  try {
    await prisma.$connect();

    // 1. Create User
    const user = await prisma.user.create({
      data: {
        email: `verify_ins_${createId()}@example.com`,
        passwordHash: "dummyhash",
        fullName: "Insights Candidate",
        role: "CANDIDATE",
      },
    });
    userId = user.id;

    // 2. Create 3 templates, tests, and evaluations with different scores and dates
    const overallScores = [70.0, 90.0, 80.0]; // Average: 80.0, Max: 90.0
    const dates = [
      new Date(Date.now() - 3 * 3600000), // oldest
      new Date(Date.now() - 1 * 3600000), // newest
      new Date(Date.now() - 2 * 3600000), // middle
    ];

    for (let i = 0; i < 3; i++) {
      const template = await prisma.template.create({
        data: {
          templateKey: `verify_ins_tpl_${i}_${createId()}`,
          conceptKey: `concept_${i}`,
          difficultyLevel: "MEDIUM",
          questionType: "mcq",
        },
      });
      templateIds.push(template.id);

      const test = await prisma.test.create({
        data: {
          userId: userId,
          templateId: template.id,
          status: "COMPLETED",
        },
      });
      testIds.push(test.id);

      const evaluation = await prisma.evaluationResult.create({
        data: {
          testId: test.id,
          userId: userId,
          communicationScore: 80.0,
          technicalScore: 88.0,
          confidenceScore: 90.0,
          overallScore: overallScores[i],
          overallRating: 4.5,
          evaluatedAt: dates[i],
        },
      });
      evaluationIds.push(evaluation.id);
    }

    console.log(`Setup complete. User: ${userId}`);

    // 3. Invoke getPerformanceSummary
    console.log("Invoking performanceService.getPerformanceSummary...");
    const summary = await performanceService.getPerformanceSummary(userId);

    // Assertions
    if (!summary) {
      throw new Error("Performance summary response is undefined");
    }

    console.log("Verifying tests completed count...");
    if (summary.testsCompleted !== 3) {
      throw new Error(
        `Expected testsCompleted 3, got ${summary.testsCompleted}`,
      );
    }

    console.log("Verifying average score calculation...");
    if (summary.averageScore !== 80.0) {
      throw new Error(
        `Expected averageScore 80.0, got ${summary.averageScore}`,
      );
    }

    console.log("Verifying best score calculation...");
    if (summary.bestScore !== 90.0) {
      throw new Error(`Expected bestScore 90.0, got ${summary.bestScore}`);
    }

    console.log("Verifying last assessment date tracking...");
    const expectedLastDate = dates[1].getTime(); // newest
    if (!summary.lastAssessmentDate) {
      throw new Error("lastAssessmentDate is null or undefined");
    }
    const actualLastDate = new Date(summary.lastAssessmentDate).getTime();
    if (Math.abs(actualLastDate - expectedLastDate) > 1000) {
      throw new Error(
        `Expected lastAssessmentDate ${dates[1].toISOString()}, got ${new Date(summary.lastAssessmentDate).toISOString()}`,
      );
    }

    console.log("Dashboard insights verification: PASS");

    console.log("\n==========================================");
    console.log("INSIGHTS PASS");
    console.log("==========================================\n");
    process.exit(0);
  } catch (err: any) {
    console.error("\n==========================================");
    console.error("INSIGHTS FAIL");
    console.error(err.message || err);
    console.error("==========================================\n");
    process.exit(1);
  } finally {
    // Teardown
    console.log("Starting teardown...");
    for (const evaluationId of evaluationIds) {
      await prisma.evaluationResult
        .delete({ where: { id: evaluationId } })
        .catch(() => {});
    }
    for (const testId of testIds) {
      await prisma.test.delete({ where: { id: testId } }).catch(() => {});
    }
    for (const templateId of templateIds) {
      await prisma.template
        .delete({ where: { id: templateId } })
        .catch(() => {});
    }
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

run();
