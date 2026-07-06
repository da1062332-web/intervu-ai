import { Test, TestingModule } from "@nestjs/testing";
import { AdminAnalyticsController } from "../controllers/admin-analytics.controller";
import { AdminAnalyticsSyncService } from "../services/admin-analytics-sync.service";
import { ContentCoverageService } from "../services/content-coverage.service";
import { GenerationJobService } from "../../generation-ai/services/generation-job.service";
import { PrismaService } from "../../../prisma/prisma.service";

describe("ReviewDashboard", () => {
  let controller: AdminAnalyticsController;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminAnalyticsController],
      providers: [
        {
          provide: AdminAnalyticsSyncService,
          useValue: {
            syncAll: jest.fn().mockResolvedValue({
              generation: { id: "gen-1" },
              review: { id: "rev-1", pendingReviews: 5, approvedToday: 3, rejectedToday: 1, avgReviewTimeSeconds: 120, reviewerWorkload: { "AI Reviewer": 4 } },
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
            reviewAnalytics: {
              findFirst: jest.fn().mockResolvedValue({
                pendingReviews: 5,
                approvedToday: 3,
                rejectedToday: 1,
                avgReviewTimeSeconds: 120,
                reviewerWorkload: { "AI Reviewer": 4 },
              }),
            },
            question: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            questionReview: {
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<AdminAnalyticsController>(AdminAnalyticsController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should fetch review dashboard stats including pending items and reviewer workload", async () => {
    const res = await controller.getReviewAnalytics();
    expect(res).toBeDefined();
    expect(res.pendingReviews).toBe(5);
    expect(res.approvedToday).toBe(3);
    expect((res.reviewerWorkload as any)["AI Reviewer"]).toBe(4);
    expect(res.reviewerQueue).toBeDefined();
  });
});
