import { Test, TestingModule } from "@nestjs/testing";
import { AdminAnalyticsController } from "../controllers/admin-analytics.controller";
import { AdminAnalyticsSyncService } from "../services/admin-analytics-sync.service";
import { ContentCoverageService } from "../services/content-coverage.service";
import { GenerationJobService } from "../../generation-ai/services/generation-job.service";
import { PrismaService } from "../../../prisma/prisma.service";

describe("GenerationAnalytics", () => {
  let controller: AdminAnalyticsController;
  let syncService: AdminAnalyticsSyncService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAnalyticsController],
      providers: [
        {
          provide: AdminAnalyticsSyncService,
          useValue: {
            syncAll: jest.fn().mockResolvedValue({
              generation: { id: "gen-1", requests: 10, successes: 8, failures: 2 },
              review: { id: "rev-1" },
            }),
          },
        },
        {
          provide: ContentCoverageService,
          useValue: {
            calculateCoverage: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: GenerationJobService,
          useValue: {
            retryJob: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            generationAnalytics: {
              findFirst: jest.fn().mockResolvedValue(null),
            },
            question: {
              count: jest.fn().mockResolvedValue(100),
            },
            assembledTest: {
              count: jest.fn().mockResolvedValue(10),
            },
            testInstance: {
              count: jest.fn().mockResolvedValue(5),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<AdminAnalyticsController>(AdminAnalyticsController);
    syncService = module.get<AdminAnalyticsSyncService>(AdminAnalyticsSyncService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should retrieve generation analytics stats and trigger sync if none exist", async () => {
    const res = await controller.getGenerationAnalytics();
    expect(res).toBeDefined();
    expect(res.requests).toBe(10);
    expect(res.successes).toBe(8);
    expect(syncService.syncAll).toHaveBeenCalled();
  });
});
