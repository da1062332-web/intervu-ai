import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaClient, RecommendationPriority } from "@prisma/client";
import { EvaluationResultRepository } from "../evaluation-result.repository";
import { SkillScoreRepository } from "../skill-score.repository";
import { RecommendationRepository } from "../recommendation.repository";
import { PerformanceSummaryRepository } from "../performance-summary.repository";
import { EvaluationPersistenceService } from "../../../../../apps/api/src/modules/results/services/evaluation-persistence.service";
import { DashboardMetricsAggregator } from "../../../../../apps/api/src/modules/results/services/dashboard-metrics-aggregator";

const mockPrisma = {
  evaluationResult: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  skillScore: {
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  recommendation: {
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  performanceSummary: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  $executeRawUnsafe: vi.fn(),
  $transaction: vi.fn((fn) => fn(mockPrisma)),
} as unknown as PrismaClient;

describe("Day 5 Repository Unit Tests", () => {
  let evaluationRepo: EvaluationResultRepository;
  let skillScoreRepo: SkillScoreRepository;
  let recommendationRepo: RecommendationRepository;
  let summaryRepo: PerformanceSummaryRepository;
  let aggregator: DashboardMetricsAggregator;
  let persistenceService: EvaluationPersistenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    evaluationRepo = new EvaluationResultRepository(mockPrisma);
    skillScoreRepo = new SkillScoreRepository(mockPrisma);
    recommendationRepo = new RecommendationRepository(mockPrisma);
    summaryRepo = new PerformanceSummaryRepository(mockPrisma);
    aggregator = new DashboardMetricsAggregator(summaryRepo);
    persistenceService = new EvaluationPersistenceService(
      mockPrisma,
      evaluationRepo,
      skillScoreRepo,
      recommendationRepo,
      aggregator,
    );
  });

  it("EVAL-DB-001: should create evaluation result successfully", async () => {
    const input = {
      testInstanceId: "inst-123",
      userId: "user-123",
      overallScore: 85.5,
      confidenceScore: 0.9,
      totalQuestions: 10,
      correctAnswers: 8,
      incorrectAnswers: 2,
    };
    const mockOutput = { id: "eval-123", ...input };
    vi.mocked(mockPrisma.evaluationResult.create).mockResolvedValue(
      mockOutput as any,
    );

    const result = await evaluationRepo.createEvaluation(input);
    expect(result.id).toBe("eval-123");
    expect(mockPrisma.evaluationResult.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        testInstanceId: "inst-123",
        userId: "user-123",
        overallScore: 85.5,
      }),
    });
  });

  it("EVAL-DB-002: should batch create skill scores successfully", async () => {
    const input = [
      {
        evaluationId: "eval-123",
        skill: "Typescript",
        score: 90,
        feedback: "Great type safety knowledge",
      },
      {
        evaluationId: "eval-123",
        skill: "SQL",
        score: 80,
        feedback: "Understands check constraints",
      },
    ];
    vi.mocked(mockPrisma.skillScore.createMany).mockResolvedValue({ count: 2 });

    const result = await skillScoreRepo.createMany(input);
    expect(result.count).toBe(2);
    expect(mockPrisma.skillScore.createMany).toHaveBeenCalledWith({
      data: input,
    });
  });

  it("EVAL-DB-003: should batch create recommendations successfully", async () => {
    const input = [
      {
        evaluationId: "eval-123",
        skill: "SQL",
        priority: RecommendationPriority.HIGH,
        title: "Study check constraints",
        description: "Focus on XOR constraints",
      },
    ];
    vi.mocked(mockPrisma.recommendation.createMany).mockResolvedValue({
      count: 1,
    });

    const result = await recommendationRepo.createMany(input);
    expect(result.count).toBe(1);
    expect(mockPrisma.recommendation.createMany).toHaveBeenCalledWith({
      data: input,
    });
  });

  it("EVAL-DB-004: should execute raw SQL to update user performance summary atomically", async () => {
    const userId = "user-123";
    const date = new Date();
    vi.mocked(mockPrisma.$executeRawUnsafe).mockResolvedValue(1);

    await aggregator.aggregateAndUpsert(userId, 80.0, date, mockPrisma);

    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO "PerformanceSummary"'),
      expect.any(String), // generated id
      userId,
      80.0,
      date,
    );
  });

  it("EVAL-DB-005: should rollback transaction if nested write fails", async () => {
    const payload = {
      evaluation: {
        testInstanceId: "inst-123",
        userId: "user-123",
        overallScore: 85.5,
        confidenceScore: 0.9,
        totalQuestions: 10,
        correctAnswers: 8,
        incorrectAnswers: 2,
      },
      skills: [{ skill: "Typescript", score: 90, feedback: "Feedback" }],
      recommendations: [
        {
          skill: "SQL",
          priority: RecommendationPriority.HIGH,
          title: "Title",
          description: "Desc",
        },
      ],
    };

    // Make the underlying create call fail
    vi.mocked(mockPrisma.evaluationResult.create).mockRejectedValue(
      new Error("DB_SAVE_FAILED"),
    );

    await expect(
      persistenceService.storeEvaluationOutcome(payload),
    ).rejects.toThrow("DB_SAVE_FAILED");
  });
});
