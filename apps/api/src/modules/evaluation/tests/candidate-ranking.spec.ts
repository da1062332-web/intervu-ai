import { Test, TestingModule } from "@nestjs/testing";
import { CandidateRankingService } from "../ranking/candidate-ranking.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("CandidateRankingService", () => {
  let service: CandidateRankingService;
  let prisma: PrismaService;

  const mockTestInstance = {
    id: "attempt_123",
    testConfigId: "cfg_456",
    submittedAt: new Date("2026-07-15T12:00:00Z"),
    testConfig: {
      companyName: "Google",
    },
  };

  const prismaMock = {
    testInstance: {
      findUnique: jest.fn(),
    },
    candidateResult: {
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateRankingService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CandidateRankingService>(CandidateRankingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw NotFoundException if attempt does not exist", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue(null);

    await expect(
      service.calculateRanking({
        id: "res_1",
        attemptId: "invalid",
        candidateId: "cand_1",
        score: 80,
        percentage: 80,
        createdAt: new Date(),
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("should calculate correct rankings and percentiles across all cohorts", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue(mockTestInstance);

    // Setup mock groupBy results
    // Assessment: Total = 10, Higher = 2, Equal = 1 -> Rank = 3
    prismaMock.candidateResult.groupBy
      .mockResolvedValueOnce([
        { percentage: 90, _count: { id: 2 } },
        { percentage: 80, _count: { id: 1 } },
        { percentage: 70, _count: { id: 7 } },
      ]) // Assessment (Total = 10)
      .mockResolvedValueOnce([
        { percentage: 90, _count: { id: 4 } },
        { percentage: 80, _count: { id: 2 } },
        { percentage: 70, _count: { id: 14 } },
      ]) // Org (Total = 20)
      .mockResolvedValueOnce([
        { percentage: 80, _count: { id: 1 } },
        { percentage: 70, _count: { id: 4 } },
      ]); // Batch (Total = 5)

    const result = await service.calculateRanking({
      id: "res_1",
      attemptId: "attempt_123",
      candidateId: "candidate_1",
      score: 80,
      percentage: 80,
      createdAt: new Date(),
    });

    expect(result).toBeDefined();
    expect(result.rank).toBe(3);
    expect(result.totalCandidates).toBe(10);
    expect(result.percentile).toBe(75);
    expect(result.assessment).toEqual({
      rank: 3,
      totalCandidates: 10,
      percentile: 75,
    });
    expect(result.organization).toEqual({
      rank: 5,
      totalCandidates: 20,
      percentile: 75,
    });
    expect(result.batch).toEqual({
      rank: 1,
      totalCandidates: 5,
      percentile: 90,
    });

    expect(prisma.testInstance.findUnique).toHaveBeenCalledWith({
      where: { id: "attempt_123" },
      include: { testConfig: true },
    });
  });
});
