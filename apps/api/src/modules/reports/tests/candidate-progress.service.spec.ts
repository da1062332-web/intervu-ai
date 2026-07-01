import { Test, TestingModule } from "@nestjs/testing";
import { CandidateProgressService } from "../services/candidate-progress.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { ReportAuditService } from "../services/report-audit.service";

describe("CandidateProgressService", () => {
  let service: CandidateProgressService;
  let prisma: PrismaService;
  let cacheService: RedisCacheService;
  let auditService: ReportAuditService;

  const mockPrisma = {
    evaluationResult: {
      findMany: jest.fn(),
    },
    candidateAnswer: {
      findMany: jest.fn(),
    },
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  const mockAuditService = {
    logProgressViewed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateProgressService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisCacheService, useValue: mockCacheService },
        { provide: ReportAuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<CandidateProgressService>(CandidateProgressService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheService = module.get<RedisCacheService>(RedisCacheService);
    auditService = module.get<ReportAuditService>(ReportAuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return cached progress if available", async () => {
    const cachedData = { assessmentCount: 5, averageScore: 80 };
    mockCacheService.get.mockResolvedValue(cachedData);

    const result = await service.getCandidateProgress("user-1");

    expect(result).toEqual(cachedData);
    expect(mockCacheService.get).toHaveBeenCalledWith("user-1", {
      prefix: "progress:candidate",
    });
    expect(mockAuditService.logProgressViewed).toHaveBeenCalledWith("user-1");
    expect(mockPrisma.evaluationResult.findMany).not.toHaveBeenCalled();
  });

  it("should calculate progress and set cache if miss", async () => {
    mockCacheService.get.mockResolvedValue(null);

    const mockEvals = [
      {
        overallScore: 80,
        evaluatedAt: new Date(),
        totalQuestions: 10,
        correctAnswers: 8,
        skillScores: [{ skill: "Coding", score: 80 }],
        testInstance: {
          testConfig: { displayName: "JS Code", difficultyLevel: "MEDIUM" },
        },
      },
    ];

    mockPrisma.evaluationResult.findMany.mockResolvedValue(mockEvals);
    mockPrisma.candidateAnswer.findMany.mockResolvedValue([]);

    const result = await service.getCandidateProgress("user-1");

    expect(result.assessmentCount).toBe(1);
    expect(result.averageScore).toBe(80);
    expect(mockCacheService.set).toHaveBeenCalledWith(
      "user-1",
      expect.any(Object),
      {
        prefix: "progress:candidate",
        ttl: 600,
      },
    );
    expect(mockAuditService.logProgressViewed).toHaveBeenCalledWith("user-1");
  });
});
