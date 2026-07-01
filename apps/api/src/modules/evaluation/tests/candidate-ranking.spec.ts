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
      count: jest.fn(),
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

    // Setup mock counts:
    // For Assessment: Total = 10, Higher = 2, Equal = 1 -> Rank = 3, Percentile = ((7 + 0.5) / 10) * 100 = 75
    // For Org: Total = 20, Higher = 4, Equal = 2 -> Rank = 5, Percentile = ((14 + 1) / 20) * 100 = 75
    // For Batch: Total = 5, Higher = 0, Equal = 1 -> Rank = 1, Percentile = ((4 + 0.5) / 5) * 100 = 90
    prismaMock.candidateResult.count
      .mockResolvedValueOnce(10) // Assessment total
      .mockResolvedValueOnce(2) // Assessment higher
      .mockResolvedValueOnce(1) // Assessment equal
      .mockResolvedValueOnce(20) // Org total
      .mockResolvedValueOnce(4) // Org higher
      .mockResolvedValueOnce(2) // Org equal
      .mockResolvedValueOnce(5) // Batch total
      .mockResolvedValueOnce(0) // Batch higher
      .mockResolvedValueOnce(1); // Batch equal

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
