import { Test, TestingModule } from "@nestjs/testing";
import { BenchmarkService } from "../benchmarking/benchmark.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("BenchmarkService", () => {
  let service: BenchmarkService;
  let prisma: PrismaService;

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

  const mockCohort = [
    {
      candidateResult: { percentage: 80 },
      evaluationAnalytics: {
        sectionAccuracy: { Math: 90, Logic: 70 },
        topicAccuracy: { percentages: 90, probability: 70 },
        difficultyAccuracy: { EASY: 100, MEDIUM: 80, HARD: 60 },
      },
    },
    {
      candidateResult: { percentage: 60 },
      evaluationAnalytics: {
        sectionAccuracy: { Math: 70, Logic: 50 },
        topicAccuracy: { percentages: 70, probability: 50 },
        difficultyAccuracy: { EASY: 80, MEDIUM: 60, HARD: 40 },
      },
    },
  ];

  const prismaMock = {
    testInstance: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
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
    prisma = module.get<PrismaService>(PrismaService);
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

  it("should calculate correct average score benchmark comparisons", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue(mockAttempt);
    prismaMock.testInstance.findMany.mockResolvedValue(mockCohort);

    const result = await service.getBenchmark("attempt_1");

    expect(result).toBeDefined();
    // Candidate percentage: 80, Cohort average: (80 + 60) / 2 = 70
    expect(result.candidate).toBe(80);
    expect(result.assessmentAverage).toBe(70);

    // Sections
    expect(result.sections).toEqual([
      {
        sectionKey: "sec_math",
        sectionName: "Math",
        candidateScore: 90,
        averageScore: 80,
      },
      {
        sectionKey: "sec_logic",
        sectionName: "Logic",
        candidateScore: 70,
        averageScore: 60,
      },
    ]);

    // Topics
    expect(result.topics).toEqual([
      { topicName: "percentages", candidateAccuracy: 90, averageAccuracy: 80 },
      { topicName: "probability", candidateAccuracy: 70, averageAccuracy: 60 },
    ]);

    // Difficulties
    expect(result.difficulties).toEqual([
      { difficulty: "EASY", candidateAccuracy: 100, averageAccuracy: 90 },
      { difficulty: "MEDIUM", candidateAccuracy: 80, averageAccuracy: 70 },
      { difficulty: "HARD", candidateAccuracy: 60, averageAccuracy: 50 },
    ]);
  });
});
