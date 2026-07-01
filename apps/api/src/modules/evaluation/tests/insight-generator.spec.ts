import { Test, TestingModule } from "@nestjs/testing";
import { AiInsightService } from "../insights/ai-insight.service";
import { PrismaService } from "../../../prisma/prisma.service";

describe("AiInsightService", () => {
  let service: AiInsightService;
  let prisma: PrismaService;

  const mockAttempt = {
    id: "attempt_1",
    candidateResult: { percentage: 80 },
    evaluationAnalytics: {
      topicAccuracy: { percentages: 90, probability: 40 },
      difficultyAccuracy: { EASY: 100, MEDIUM: 80, HARD: 30 },
      completionRate: 95,
      attemptRate: 95,
    },
  };

  const llmAdapterMock = {
    generate: jest.fn(),
  };

  const prismaMock = {
    testInstance: {
      findUnique: jest.fn(),
    },
    evaluationInsight: {
      upsert: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiInsightService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: "LLM_ADAPTER",
          useValue: llmAdapterMock,
        },
      ],
    }).compile();

    service = module.get<AiInsightService>(AiInsightService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should generate insights using LLM when valid JSON is returned", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue(mockAttempt);
    llmAdapterMock.generate.mockResolvedValue(
      JSON.stringify({
        insights: [
          "Strong performance in percentages.",
          "Verbal Ability requires improvement.",
        ],
      }),
    );

    const result = await service.generateInsights("attempt_1");

    expect(result).toEqual([
      "Strong performance in percentages.",
      "Verbal Ability requires improvement.",
    ]);
    expect(prismaMock.evaluationInsight.upsert).toHaveBeenCalled();
  });

  it("should fallback to rule-based insights if LLM generation fails or returns mock", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue(mockAttempt);
    llmAdapterMock.generate.mockRejectedValue(new Error("API Error"));

    const result = await service.generateInsights("attempt_1");

    expect(result).toBeDefined();
    expect(result).toContain("Strong performance in percentages.");
    expect(result).toContain("probability requires improvement.");
    expect(result).toContain("High completion rate indicates strong time management.");
    expect(prismaMock.evaluationInsight.upsert).toHaveBeenCalled();
  });
});
