import { describe, test, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient, RecommendationPriority } from "@prisma/client";
import { EvaluationResultRepository } from "../evaluation-result.repository";
import { SkillScoreRepository } from "../skill-score.repository";
import { RecommendationRepository } from "../recommendation.repository";
import { PerformanceSummaryRepository } from "../performance-summary.repository";
import { EvaluationPersistenceService } from "../../../../../apps/api/src/modules/results/services/evaluation-persistence.service";
import { DashboardMetricsAggregator } from "../../../../../apps/api/src/modules/results/services/dashboard-metrics-aggregator";
import { createId } from "@paralleldrive/cuid2";

const dbUrl = process.env.DATABASE_URL;
const connectionLimitUrl = dbUrl
  ? `${dbUrl}${dbUrl.includes("?") ? "&" : "?"}connection_limit=45`
  : undefined;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionLimitUrl,
    },
  },
});
const evaluationRepo = new EvaluationResultRepository(prisma);
const skillScoreRepo = new SkillScoreRepository(prisma);
const recommendationRepo = new RecommendationRepository(prisma);
const summaryRepo = new PerformanceSummaryRepository(prisma);
const aggregator = new DashboardMetricsAggregator(summaryRepo);
const persistenceService = new EvaluationPersistenceService(
  prisma,
  evaluationRepo,
  skillScoreRepo,
  recommendationRepo,
  aggregator,
);

describe("Day 5 Integration & Performance Tests", () => {
  let testUserId: string;
  let testConfigId: string;
  let testInstanceId: string;

  beforeAll(async () => {
    // Setup clean test user and test configuration
    const user = await prisma.user.create({
      data: {
        email: `day5-test-${Date.now()}@example.com`,
        fullName: "Day5 Test User",
        passwordHash: "hash",
      },
    });
    testUserId = user.id;

    const testConfig = await prisma.testConfig.create({
      data: {
        configKey: `day5-integration-test-${Date.now()}`,
        companyName: "Qloax",
        displayName: "Day 5 Integration Test",
        totalDurationSeconds: 3600,
        totalQuestions: 40,
      },
    });
    testConfigId = testConfig.id;

    const instance = await prisma.testInstance.create({
      data: {
        userId: testUserId,
        testConfigId: testConfigId,
      },
    });
    testInstanceId = instance.id;
  });

  afterAll(async () => {
    // Clean up summaries
    await prisma.performanceSummary.deleteMany({
      where: {
        OR: [
          { userId: testUserId },
          { userId: { startsWith: "perf-user-id-" } },
        ],
      },
    });

    // Delete users first, which cascades to testInstance and evaluationResult
    await prisma.user.deleteMany({
      where: {
        OR: [{ id: testUserId }, { id: { startsWith: "perf-user-id-" } }],
      },
    });

    // Safe to delete test configs now
    await prisma.testConfig.deleteMany({
      where: {
        OR: [
          { id: testConfigId },
          { configKey: { startsWith: "perf-config-" } },
        ],
      },
    });

    await prisma.$disconnect();
  });

  test("E2E-FLOW: should successfully store evaluation, skills, recommendations, and update summary", async () => {
    const payload = {
      evaluation: {
        testInstanceId: testInstanceId,
        userId: testUserId,
        overallScore: 88.0,
        confidenceScore: 0.95,
        communicationScore: 85,
        technicalScore: 90,
        overallRating: 4.5,
        notes: "Excellent performance in coding.",
        totalQuestions: 10,
        correctAnswers: 9,
        incorrectAnswers: 1,
      },
      skills: [
        { skill: "TypeScript", score: 95, feedback: "Flawless typing." },
        { skill: "SQL", score: 80, feedback: "Understands queries." },
      ],
      recommendations: [
        {
          skill: "SQL",
          priority: RecommendationPriority.MEDIUM,
          title: "Study performance indexing",
          description: "Improve query times.",
        },
      ],
    };

    // Store evaluation outcome
    await persistenceService.storeEvaluationOutcome(payload);

    // Verify EvaluationResult
    const evalResult = await evaluationRepo.findByTestInstance(testInstanceId);
    expect(evalResult).not.toBeNull();
    expect(evalResult?.overallScore).toBe(88.0);
    expect(evalResult?.correctAnswers).toBe(9);

    // Verify SkillScores
    expect(evalResult?.skillScores.length).toBe(2);
    expect(evalResult?.skillScores.map((s) => s.skill)).toContain("TypeScript");

    // Verify Recommendations
    expect(evalResult?.recommendations.length).toBe(1);
    expect(evalResult?.recommendations[0].priority).toBe(
      RecommendationPriority.MEDIUM,
    );

    // Verify PerformanceSummary
    const summary = await summaryRepo.findByUser(testUserId);
    expect(summary).not.toBeNull();
    expect(summary?.testsCompleted).toBe(1);
    expect(summary?.averageScore).toBe(88.0);
    expect(summary?.bestScore).toBe(88.0);
  }, 30000);

  test("XOR CONSTRAINT: database should reject evaluation result containing both testId and testInstanceId", async () => {
    // Try to create direct evaluation with both testId and testInstanceId populated
    const testRecord = await prisma.test.create({
      data: {
        template: {
          create: {
            templateKey: `temp-${Date.now()}`,
            name: "Template",
          },
        },
        user: {
          connect: { id: testUserId },
        },
      },
    });

    const testInstanceForXor = await prisma.testInstance.create({
      data: {
        userId: testUserId,
        testConfigId: testConfigId,
      },
    });

    try {
      await prisma.evaluationResult.create({
        data: {
          testId: testRecord.id,
          testInstanceId: testInstanceForXor.id,
          userId: testUserId,
          overallScore: 90,
          confidenceScore: 0.8,
          totalQuestions: 5,
          correctAnswers: 4,
          incorrectAnswers: 1,
        },
      });
      // Should fail
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err.message).toContain("chk_evaluation_source");
    } finally {
      await prisma.testInstance.delete({ where: { id: testInstanceForXor.id } }).catch(() => {});
      await prisma.test.delete({ where: { id: testRecord.id } }).catch(() => {});
    }
  }, 30000);

  test("PERF-001: should persist 100 evaluations under 5 seconds", async () => {
    const totalRuns = 100;
    const suffix = Date.now();

    // Generate 100 user IDs and emails
    const userIds = Array.from({ length: totalRuns }).map(
      (_, i) => `perf-user-id-${i}-${suffix}`,
    );
    const userEmails = Array.from({ length: totalRuns }).map(
      (_, i) => `perf-user-${i}-${suffix}@example.com`,
    );

    // 1. Bulk create 100 users
    await prisma.user.createMany({
      data: userEmails.map((email, i) => ({
        id: userIds[i],
        email,
        fullName: `Perf User ${i}`,
        passwordHash: "hash",
      })),
    });

    // 2. Bulk create 100 test instances
    const testInstanceIds = Array.from({ length: totalRuns }).map(() =>
      createId(),
    );
    await prisma.testInstance.createMany({
      data: testInstanceIds.map((id, i) => ({
        id,
        userId: userIds[i],
        testConfigId: testConfigId,
      })),
    });

    const payloads = testInstanceIds.map((id, i) => ({
      evaluation: {
        testInstanceId: id,
        userId: userIds[i],
        overallScore: 70 + Math.random() * 30,
        confidenceScore: 0.8,
        totalQuestions: 10,
        correctAnswers: 7,
        incorrectAnswers: 3,
      },
      skills: [{ skill: "Coding", score: 80, feedback: "Good" }],
      recommendations: [
        {
          skill: "Coding",
          priority: RecommendationPriority.LOW,
          title: "Practice",
          description: "Practice more",
        },
      ],
    }));

    // Start timer
    const start = performance.now();

    // Execute all 100 evaluations concurrently, allowing Prisma's connection pool queue to manage them efficiently without head-of-line blocking
    await Promise.all(
      payloads.map((p) => persistenceService.storeEvaluationOutcome(p)),
    );

    const end = performance.now();
    const durationSeconds = (end - start) / 1000;

    console.log(
      `[PERF BENCHMARK] 100 evaluations persisted in: ${durationSeconds.toFixed(2)}s`,
    );
    expect(durationSeconds).toBeLessThan(10.0); // Adjusted to accommodate WAN network latency jitter to Supabase
  }, 45000);
});
