/**
 * Phase 2: Transaction Rollback Verification Script
 * Validates transaction boundaries and rollback capabilities across major persistence flows.
 */
import { prisma } from "../packages/database/src/client";
import { AssemblyRepository } from "../packages/database/src/repositories/assembly.repository";
import { ExecutionPersistenceRepository } from "../packages/database/src/repositories/execution-persistence.repository";
import { SubmissionRepository } from "../packages/database/src/repositories/submission.repository";
import { EvaluationResultRepository } from "../packages/database/src/repositories/evaluation-result.repository";
import { SkillScoreRepository } from "../packages/database/src/repositories/skill-score.repository";
import { RecommendationRepository } from "../packages/database/src/repositories/recommendation.repository";
import { PerformanceSummaryRepository } from "../packages/database/src/repositories/performance-summary.repository";
import { DashboardMetricsAggregator } from "../apps/api/src/modules/results/services/dashboard-metrics-aggregator";
import { EvaluationPersistenceService } from "../apps/api/src/modules/results/services/evaluation-persistence.service";
import { RecommendationPriority, SubmissionStatus } from "@prisma/client";

async function run() {
  const assemblyRepo = new AssemblyRepository();
  const executionPersistenceRepo = new ExecutionPersistenceRepository(prisma);
  const submissionRepo = new SubmissionRepository(prisma);
  const evaluationResultRepo = new EvaluationResultRepository(prisma);
  const skillScoreRepo = new SkillScoreRepository(prisma);
  const recommendationRepo = new RecommendationRepository(prisma);
  const performanceSummaryRepo = new PerformanceSummaryRepository(prisma);
  const metricsAggregator = new DashboardMetricsAggregator(performanceSummaryRepo);
  const evaluationPersistenceService = new EvaluationPersistenceService(
    prisma,
    evaluationResultRepo,
    skillScoreRepo,
    recommendationRepo,
    metricsAggregator
  );

  const results: Record<string, string> = {
    assemblyRollback: "UNKNOWN",
    answerRollback: "UNKNOWN",
    submissionRollback: "UNKNOWN",
    evaluationRollback: "UNKNOWN",
  };

  try {
    // 0. Setup a test user, template, and config
    let user = await prisma.user.findFirst({ where: { email: "tx-test-user@example.com" } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "tx-test-user@example.com",
          passwordHash: "$2b$10$abcdefghijklmnopqrstuv",
          fullName: "Tx Test User",
        },
      });
    }

    let template = await prisma.template.findFirst();
    if (!template) {
      template = await prisma.template.create({
        data: {
          name: "Tx Test Template",
          difficulty: "MEDIUM",
          questionType: "multiple_choice",
        },
      });
    }

    let testConfig = await prisma.testConfig.findFirst({ where: { configKey: "tx-test-config" } });
    if (!testConfig) {
      testConfig = await prisma.testConfig.create({
        data: {
          configKey: "tx-test-config",
          companyName: "Tx Test Company",
          displayName: "Tx Test Config",
          totalDurationSeconds: 600,
          totalQuestions: 1,
        },
      });
    }

    // 1. Assembly Creation / Question Generation Rollback Test
    const instanceId1 = `tx-fail-inst-1-${Date.now()}`;
    const badSectionKey = "sec-1";
    try {
      await assemblyRepo.persistAssembly(
        {
          id: instanceId1,
          userId: user.id,
          testConfigId: testConfig.id,
        },
        [
          { id: `sec-a-${Date.now()}`, sectionKey: badSectionKey, sectionName: "Section A", durationSeconds: 300, questionCount: 1, orderIndex: 1 },
          { id: `sec-b-${Date.now()}`, sectionKey: badSectionKey, sectionName: "Section B", durationSeconds: 300, questionCount: 1, orderIndex: 1 }, // Duplicate orderIndex triggers unique constraint fail
        ],
        {}
      );
      results.assemblyRollback = "FAIL_NO_ERROR_THROWN";
    } catch (err: any) {
      const found = await prisma.testInstance.findUnique({ where: { id: instanceId1 } });
      results.assemblyRollback = !found ? "PASS" : "FAIL_PERSISTED";
      if (found) {
        await prisma.testInstance.delete({ where: { id: instanceId1 } }).catch(() => {});
      }
    }

    // 2. Answer Save Rollback Test
    const instanceId2 = `tx-fail-inst-2-${Date.now()}`;
    await prisma.testInstance.create({
      data: {
        id: instanceId2,
        userId: user.id,
        testConfigId: testConfig.id,
      },
    });
    try {
      await executionPersistenceRepo.saveAnswerAndState(
        {
          testInstanceId: instanceId2,
          questionId: "q-fail-tx-1",
          answer: { choice: "A" },
        },
        {
          testInstanceId: "non-existent-instance-id", // Violates foreign key constraint
          currentQuestionIndex: 1,
          remainingTimeSeconds: 100,
        }
      );
      results.answerRollback = "FAIL_NO_ERROR_THROWN";
    } catch (err: any) {
      const foundAnswer = await prisma.candidateAnswer.findUnique({
        where: {
          testInstanceId_questionId: {
            testInstanceId: instanceId2,
            questionId: "q-fail-tx-1",
          },
        },
      });
      results.answerRollback = !foundAnswer ? "PASS" : "FAIL_PERSISTED";
    } finally {
      await prisma.testInstance.delete({ where: { id: instanceId2 } }).catch(() => {});
    }

    // 3. Submission Rollback Test
    const instanceId3 = `tx-fail-inst-3-${Date.now()}`;
    await prisma.testInstance.create({
      data: {
        id: instanceId3,
        userId: user.id,
        testConfigId: testConfig.id,
      },
    });
    await submissionRepo.createSubmission(instanceId3);
    try {
      await prisma.$transaction(async (tx) => {
        await tx.submission.update({
          where: { testInstanceId: instanceId3 },
          data: { status: SubmissionStatus.SUBMITTED, submittedAt: new Date() },
        });
        throw new Error("FORCE_SUBMISSION_ROLLBACK");
      });
      results.submissionRollback = "FAIL_NO_ERROR_THROWN";
    } catch (err: any) {
      const sub = await submissionRepo.findByInstance(instanceId3);
      results.submissionRollback = (sub && sub.status === SubmissionStatus.PENDING) ? "PASS" : "FAIL_NOT_ROLLED_BACK";
    } finally {
      await prisma.testInstance.delete({ where: { id: instanceId3 } }).catch(() => {});
    }

    // 4. Evaluation Persistence Rollback Test
    const instanceId4 = `tx-fail-inst-4-${Date.now()}`;
    await prisma.testInstance.create({
      data: {
        id: instanceId4,
        userId: user.id,
        testConfigId: testConfig.id,
      },
    });

    const originalUpsert = performanceSummaryRepo.upsertSummaryWithCalculation;
    performanceSummaryRepo.upsertSummaryWithCalculation = async () => {
      throw new Error("MOCK_RAW_SQL_FAILURE");
    };

    try {
      await evaluationPersistenceService.storeEvaluationOutcome({
        evaluation: {
          testInstanceId: instanceId4,
          userId: user.id,
          overallScore: 88.0,
          confidenceScore: 0.95,
          totalQuestions: 1,
          correctAnswers: 1,
          incorrectAnswers: 0,
        },
        skills: [{ skill: "TS", score: 95.0, feedback: "Excellent" }],
        recommendations: [{ skill: "TS", priority: RecommendationPriority.HIGH, title: "Keep practicing", description: "Good job" }],
      });
      results.evaluationRollback = "FAIL_NO_ERROR_THROWN";
    } catch (err: any) {
      const evalRes = await prisma.evaluationResult.findUnique({ where: { testInstanceId: instanceId4 } });
      results.evaluationRollback = !evalRes ? "PASS" : "FAIL_PERSISTED";
    } finally {
      performanceSummaryRepo.upsertSummaryWithCalculation = originalUpsert;
      await prisma.testInstance.delete({ where: { id: instanceId4 } }).catch(() => {});
    }

    const allPassed = Object.values(results).every((v) => v === "PASS");

    return {
      success: allPassed,
      data: results,
      error: allPassed ? null : { code: "TRANSACTION_ROLLBACK_FAILURE", message: "One or more transaction rollback scenarios failed." },
      meta: { timestamp: new Date().toISOString() },
    };

  } catch (err: any) {
    return {
      success: false,
      data: null,
      error: { code: "SCRIPT_EXECUTION_ERROR", message: err.message },
      meta: { timestamp: new Date().toISOString() },
    };
  }
}

run().then((res) => {
  console.log(JSON.stringify(res, null, 2));
  process.exit(res.success ? 0 : 1);
});
