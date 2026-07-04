import { Test, TestingModule } from "@nestjs/testing";
import { CandidateRankingService } from "../ranking/candidate-ranking.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("CandidateRankingService", () => {
  let service: CandidateRankingService;

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should calculate correct rankings and percentiles using optimized groupBy queries", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue(mockTestInstance);

    // Mock groupBy results
    // Assessment: 3 candidates with percentage 90, 1 candidate with percentage 80 (total 4, higher 3, equal 1)
    // Org: 5 candidates with percentage 85, 2 candidates with percentage 80 (total 7, higher 5, equal 2)
    // Batch: 4 candidates with percentage 70, 1 candidate with percentage 80 (total 5, higher 0, equal 1)
    prismaMock.candidateResult.groupBy
      .mockResolvedValueOnce([
        { percentage: 90, _count: { id: 3 } },
        { percentage: 80, _count: { id: 1 } },
      ]) // Assessment
      .mockResolvedValueOnce([
        { percentage: 85, _count: { id: 5 } },
        { percentage: 80, _count: { id: 2 } },
      ]) // Org
      .mockResolvedValueOnce([
        { percentage: 70, _count: { id: 4 } },
        { percentage: 80, _count: { id: 1 } },
      ]); // Batch

    const result = await service.calculateRanking({
      id: "res_1",
      attemptId: "attempt_123",
      candidateId: "candidate_1",
      score: 80,
      percentage: 80,
      createdAt: new Date(),
    });

    expect(result).toBeDefined();
    // Assessment Rank: 3 higher + 1 = 4. Percentile: ((0 + 0.5 * 1)/4) * 100 = 12.5%
    expect(result.rank).toBe(4);
    expect(result.totalCandidates).toBe(4);
    expect(result.percentile).toBe(12.5);

    // Batch: 4 lower + 1 equal. Percentile: ((4 + 0.5 * 1)/5) * 100 = 90%
    expect(result.batch).toEqual({
      rank: 1,
      totalCandidates: 5,
      percentile: 90,
    });
  });
});
