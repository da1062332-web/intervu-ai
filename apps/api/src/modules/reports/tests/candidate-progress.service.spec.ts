import { Test, TestingModule } from "@nestjs/testing";
import { CandidateProgressService } from "../services/candidate-progress.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { ReportAuditService } from "../services/report-audit.service";
import { ResultsService } from "../../results/services/results.service";

describe("CandidateProgressService", () => {
  let service: CandidateProgressService;
  let prisma: PrismaService;
  let cacheService: RedisCacheService;
  let auditService: ReportAuditService;

  const mockPrisma = {
    testInstance: {
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
        { 
          provide: ResultsService, 
          useValue: {
            getResultDetails: jest.fn().mockResolvedValue({
              percentage: 80,
              evaluationAnalytics: { completionRate: 100, topicAccuracy: { "Coding": 80 }, difficultyAccuracy: { "medium": 80 } }
            })
          } 
        },
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
      prefix: "progress:candidate:v4",
    });
    expect(mockAuditService.logProgressViewed).toHaveBeenCalledWith("user-1");
    expect(mockPrisma.testInstance.findMany).not.toHaveBeenCalled();
  });

  it("should calculate progress and set cache if miss", async () => {
    mockCacheService.get.mockResolvedValue(null);

    const mockAttempts = [
      {
        id: "ti-1",
        evaluationResult: {
          createdAt: new Date(),
          overallScore: 80,
        },
        evaluationAnalytics: {
          completionRate: 100,
          topicAccuracy: { "Coding": 80 },
          difficultyAccuracy: { "medium": 80 },
        },
        testConfig: { displayName: "JS Code", difficultyLevel: "MEDIUM" },
      }
    ];

    mockPrisma.testInstance.findMany.mockResolvedValue(mockAttempts);

    const result = await service.getCandidateProgress("user-1");

    expect(result.overview.totalAssessments).toBe(1);
    expect(result.overview.averageScore).toBe(80);
    expect(mockCacheService.set).toHaveBeenCalledWith(
      "user-1",
      expect.any(Object),
      {
        prefix: "progress:candidate:v4",
        ttl: 600,
      },
    );
    expect(mockAuditService.logProgressViewed).toHaveBeenCalledWith("user-1");
  });
});
