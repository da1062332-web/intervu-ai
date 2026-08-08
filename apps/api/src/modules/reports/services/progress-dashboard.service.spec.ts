import { Test, TestingModule } from "@nestjs/testing";
import { CandidateProgressService } from "./candidate-progress.service";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { ReportAuditService } from "./report-audit.service";
import { ResultsService } from "../../results/services/results.service";

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
        {
          provide: ResultsService,
          useValue: {
            getResultDetails: jest
              .fn()
              .mockImplementation((attemptId: string) => {
                if (attemptId === "ti-1") {
                  return Promise.resolve({
                    percentage: 80,
                    evaluationAnalytics: {
                      completionRate: 100,
                      topicAccuracy: { Coding: 80 },
                      difficultyAccuracy: { medium: 80 },
                    },
                  });
                } else if (attemptId === "ti-2") {
                  return Promise.resolve({
                    percentage: 90,
                    evaluationAnalytics: {
                      completionRate: 100,
                      topicAccuracy: { Coding: 90 },
                      difficultyAccuracy: { medium: 90 },
                    },
                  });
                }
                return Promise.resolve({});
              }),
          },
        },
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
        evaluationResult: {
          createdAt: new Date(),
          overallScore: 80,
        },
        evaluationAnalytics: {
          completionRate: 100,
          topicAccuracy: { Coding: 80 },
          difficultyAccuracy: { medium: 80 },
        },
        testConfig: { displayName: "Assessment 1" },
      },
      {
        id: "ti-2",
        evaluationResult: {
          createdAt: new Date(),
          overallScore: 90,
        },
        evaluationAnalytics: {
          completionRate: 100,
          topicAccuracy: { Coding: 90 },
          difficultyAccuracy: { medium: 90 },
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
