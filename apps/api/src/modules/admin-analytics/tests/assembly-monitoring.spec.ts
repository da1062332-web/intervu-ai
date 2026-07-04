import { Test, TestingModule } from "@nestjs/testing";
import { AdminAnalyticsController } from "../controllers/admin-analytics.controller";
import { AdminAnalyticsSyncService } from "../services/admin-analytics-sync.service";
import { ContentCoverageService } from "../services/content-coverage.service";
import { GenerationJobService } from "../../generation-ai/services/generation-job.service";
import { PrismaService } from "../../../prisma/prisma.service";

describe("AssemblyMonitoring", () => {
  let controller: AdminAnalyticsController;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mockAssemblies = [
      {
        id: "asm-1",
        configId: "cfg-1",
        status: "PUBLISHED",
        totalQuestions: 15,
        totalDurationSeconds: 1800,
        createdAt: new Date(),
        examConfig: { name: "Senior Developer Test" },
        versions: [{ version: 2 }],
      },
    ];

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAnalyticsController],
      providers: [
        {
          provide: AdminAnalyticsSyncService,
          useValue: {
            syncAll: jest.fn(),
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
            assembledTest: {
              count: jest.fn().mockImplementation((args) => {
                if (args?.where?.status === "PUBLISHED") return Promise.resolve(1);
                if (args?.where?.status === "DRAFT") return Promise.resolve(0);
                return Promise.resolve(1); // total
              }),
              findMany: jest.fn().mockResolvedValue(mockAssemblies),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<AdminAnalyticsController>(AdminAnalyticsController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should retrieve assembly statistics, drafts, and detailed historical runs", async () => {
    const res = await controller.getAssemblyAnalytics();
    expect(res).toBeDefined();
    expect(res.assembliesCreated).toBe(1);
    expect(res.publishedTests).toBe(1);
    expect(res.draftTests).toBe(0);
    expect(res.drilldowns.length).toBe(1);
    expect(res.drilldowns[0].assessment).toBe("Senior Developer Test");
  });
});
