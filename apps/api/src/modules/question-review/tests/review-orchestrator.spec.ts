import { Test, TestingModule } from "@nestjs/testing";
import { AIReviewService } from "../reviewers/ai-review.service";
import { QuestionRepository } from "../../question-bank/repositories/question.repository";
import { QuestionVersionRepository } from "../../question-bank/repositories/question-version.repository";
import { TopicRepository } from "../../concept-mapping/repositories/topic.repository";
import { StructureAnalyzerService } from "../analyzers/structure-analyzer.service";
import { DifficultyAnalyzerService } from "../analyzers/difficulty-analyzer.service";
import { TopicAnalyzerService } from "../analyzers/topic-analyzer.service";
import { QuestionAnalyticsService } from "../analyzers/question-analytics.service";
import { ApprovalEngineService } from "../reviewers/approval-engine.service";
import { QuestionEnrichmentService } from "../enrichers/question-enrichment.service";
import { ReviewAuditService } from "../services/review-audit.service";
import { GenerationMonitorService } from "../monitoring/generation-monitor.service";
import { PrismaService } from "../../../prisma/prisma.service";

describe("AIReviewService Orchestrator", () => {
  let service: AIReviewService;

  let questionRepoMock: any;

  let versionRepoMock: any;

  let topicRepoMock: any;

  let prismaMock: any;

  beforeEach(async () => {
    questionRepoMock = {
      findById: jest.fn(),
    };

    versionRepoMock = {
      findByQuestionId: jest.fn().mockResolvedValue([]),
    };

    topicRepoMock = {
      findById: jest.fn(),
    };

    prismaMock = {
      $transaction: jest.fn((callback) => callback(prismaMock)),
      question: {
        update: jest
          .fn()
          .mockResolvedValue({ id: "q-123", version: 2, status: "ACTIVE" }),
      },
      questionVersion: {
        create: jest.fn(),
      },
      reviewAuditLog: {
        count: jest.fn().mockResolvedValue(0),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIReviewService,
        StructureAnalyzerService,
        DifficultyAnalyzerService,
        TopicAnalyzerService,
        QuestionAnalyticsService,
        ApprovalEngineService,
        QuestionEnrichmentService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: QuestionRepository,
          useValue: questionRepoMock,
        },
        {
          provide: QuestionVersionRepository,
          useValue: versionRepoMock,
        },
        {
          provide: TopicRepository,
          useValue: topicRepoMock,
        },
        {
          provide: ReviewAuditService,
          useValue: {
            logReview: jest.fn(),
          },
        },
        {
          provide: GenerationMonitorService,
          useValue: {
            recordReview: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AIReviewService>(AIReviewService);
  });

  it("should review a valid question and recommend APPROVE", async () => {
    questionRepoMock.findById.mockResolvedValue({
      id: "q-123",
      questionText: "What is 10 percent of 100?",
      answer: "10",
      explanation: "10% of 100 is 10.",
      difficulty: "EASY",
      topicId: "t-1",
    });

    topicRepoMock.findById.mockResolvedValue({
      id: "t-1",
      name: "Percentages",
    });

    versionRepoMock.findByQuestionId.mockResolvedValue([
      {
        snapshot: {
          options: ["5", "10", "15", "20"],
        },
      },
    ]);

    const res = await service.reviewQuestion("q-123");

    expect(res.recommendation).toBe("APPROVE");
    expect(res.score).toBeGreaterThan(85);
    expect(res.issues.length).toBe(0);
  });
});
