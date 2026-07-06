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
      evaluationResult: { findMany: jest.fn() },
      candidateAnswer: { findMany: jest.fn() },
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
    prisma.evaluationResult.findMany.mockResolvedValue([]);
    prisma.candidateAnswer.findMany.mockResolvedValue([]);

    const result = await service.getCandidateProgress("user-1");
    expect(result.overview.totalAssessments).toBe(0);
    expect(result.overview.averageScore).toBe(0);
    expect(result.trend).toEqual([]);
    expect(result.skills).toEqual([]);
  });

  it("should compile progress report accurately", async () => {
    prisma.evaluationResult.findMany.mockResolvedValue([
      {
        overallScore: 80,
        evaluatedAt: new Date(),
        testInstanceId: "ti-1",
        testInstance: { testConfig: { displayName: "Assessment 1" } },
      },
      {
        overallScore: 90,
        evaluatedAt: new Date(),
        testInstanceId: "ti-2",
        testInstance: { testConfig: { displayName: "Assessment 2" } },
      },
    ]);
    prisma.candidateAnswer.findMany.mockResolvedValue([]);

    const result = await service.getCandidateProgress("user-1");
    expect(result.overview.totalAssessments).toBe(2);
    expect(result.overview.averageScore).toBe(85);
    expect(result.overview.topPercentileScore).toBe(90);
    expect(result.trend.length).toBe(2);
    // Explicit aliases check
    expect(result.attemptsOverTime).toBeDefined();
    expect(result.bestScore).toBe(90);
  });
});
