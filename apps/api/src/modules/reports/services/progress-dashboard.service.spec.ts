import { Test, TestingModule } from "@nestjs/testing";
import { CandidateProgressService } from "./candidate-progress.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { ReportAuditService } from "./report-audit.service";

describe("CandidateProgressService", () => {
  let service: CandidateProgressService;
  let prisma: any;
  let cacheService: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      testInstance: { findMany: jest.fn() },
    };
    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };
    auditService = {
      logProgressViewed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateProgressService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisCacheService, useValue: cacheService },
        { provide: ReportAuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<CandidateProgressService>(CandidateProgressService);
  });

  it("should return empty progress if no evaluations", async () => {
    prisma.testInstance.findMany.mockResolvedValue([]);

    const result = await service.getCandidateProgress("user-1");
    expect(result.overview.totalAssessments).toBe(0);
    expect(result.overview.averageScore).toBe(0);
    expect(result.trend).toEqual([]);
    expect(result.skills).toEqual([]);
  });

  it("should compile progress report accurately", async () => {
    prisma.testInstance.findMany.mockResolvedValue([
      {
        id: "ti-1",
        candidateResult: {
          createdAt: new Date(),
          percentage: 80,
        },
        evaluationAnalytics: {
          completionRate: 100,
          topicAccuracy: { "Coding": 80 },
          difficultyAccuracy: { "medium": 80 },
        },
        testConfig: { displayName: "Assessment 1" },
      },
      {
        id: "ti-2",
        candidateResult: {
          createdAt: new Date(),
          percentage: 90,
        },
        evaluationAnalytics: {
          completionRate: 100,
          topicAccuracy: { "Coding": 90 },
          difficultyAccuracy: { "medium": 90 },
        },
        testConfig: { displayName: "Assessment 2" },
      },
    ]);

    const result = await service.getCandidateProgress("user-1");
    expect(result.overview.totalAssessments).toBe(2);
    expect(result.overview.averageScore).toBe(85);
    expect(result.overview.topPercentileScore).toBe(90);
    expect(result.trend.length).toBe(2);
    // Explicit aliases check
    expect(result.trend).toBeDefined();
    expect(result.bestScore).toBe(90);
  });
});
