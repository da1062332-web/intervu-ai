import { Test, TestingModule } from "@nestjs/testing";
import { BenchmarkService } from "../benchmarking/benchmark.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("BenchmarkService", () => {
  let service: BenchmarkService;

  const mockAttempt = {
    id: "attempt_1",
    testConfigId: "cfg_1",
    candidateResult: { percentage: 80 },
    evaluationAnalytics: {
      sectionAccuracy: { Math: 90, Logic: 70 },
      topicAccuracy: { percentages: 90, probability: 70 },
      difficultyAccuracy: { EASY: 100, MEDIUM: 80, HARD: 60 },
    },
    sections: [
      { sectionKey: "sec_math", sectionName: "Math" },
      { sectionKey: "sec_logic", sectionName: "Logic" },
    ],
  };

  const mockCohortAnalytics = [
    {
      sectionAccuracy: { Math: 90, Logic: 70 },
      topicAccuracy: { percentages: 90, probability: 70 },
      difficultyAccuracy: { EASY: 100, MEDIUM: 80, HARD: 60 },
    },
    {
      sectionAccuracy: { Math: 70, Logic: 50 },
      topicAccuracy: { percentages: 70, probability: 50 },
      difficultyAccuracy: { EASY: 80, MEDIUM: 60, HARD: 40 },
    },
  ];

  const prismaMock = {
    testInstance: {
      findUnique: jest.fn(),
    },
    candidateResult: {
      aggregate: jest.fn(),
    },
    evaluationAnalytics: {
      findMany: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BenchmarkService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<BenchmarkService>(BenchmarkService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw NotFoundException if attempt is not found", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue(null);

    await expect(service.getBenchmark("invalid")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("should calculate correct benchmarks using optimized lateral raw queries", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue(mockAttempt);
    prismaMock.candidateResult.aggregate.mockResolvedValue({
      _avg: { percentage: 75 },
      _count: { id: 2 },
    });

    // Mock successful Postgres raw query outputs
    prismaMock.$queryRawUnsafe
      .mockResolvedValueOnce([
        { name: "Math", avg: 80 },
        { name: "Logic", avg: 60 },
      ]) // sections
      .mockResolvedValueOnce([
        { name: "percentages", avg: 80 },
        { name: "probability", avg: 60 },
      ]) // topics
      .mockResolvedValueOnce([
        { name: "EASY", avg: 90 },
        { name: "MEDIUM", avg: 70 },
        { name: "HARD", avg: 50 },
      ]); // difficulties

    const result = await service.getBenchmark("attempt_1");

    expect(result).toBeDefined();
    expect(result.candidate).toBe(80);
    expect(result.assessmentAverage).toBe(75);
    expect(result.topics[0].averageAccuracy).toBe(80);
  });

  it("should fall back to prisma loop if raw query fails", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue(mockAttempt);
    prismaMock.candidateResult.aggregate.mockResolvedValue({
      _avg: { percentage: 70 },
      _count: { id: 2 },
    });
    prismaMock.$queryRawUnsafe.mockRejectedValue(new Error("Raw query failed"));
    prismaMock.evaluationAnalytics.findMany.mockResolvedValue(
      mockCohortAnalytics,
    );

    const result = await service.getBenchmark("attempt_1");

    expect(result).toBeDefined();
    expect(result.candidate).toBe(80);
    expect(result.assessmentAverage).toBe(70);
    expect(result.topics[0].averageAccuracy).toBe(80); // (90 + 70)/2 = 80
  });
});
