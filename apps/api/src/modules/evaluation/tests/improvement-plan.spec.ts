import { Test, TestingModule } from "@nestjs/testing";
import { ImprovementPlanService } from "../recommendations/improvement-plan.service";
import { PrismaService } from "../../../prisma/prisma.service";

describe("ImprovementPlanService", () => {
  let service: ImprovementPlanService;
  let prisma: PrismaService;

  const mockAttempt = {
    id: "attempt_1",
    candidateResult: { percentage: 70 },
    evaluationAnalytics: {
      topicAccuracy: { percentages: 50, probability: 60 },
    },
  };

  const llmAdapterMock = {
    generate: jest.fn(),
  };

  const prismaMock = {
    testInstance: {
      findUnique: jest.fn(),
    },
    improvementPlan: {
      upsert: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImprovementPlanService,
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

    service = module.get<ImprovementPlanService>(ImprovementPlanService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should generate study plans using LLM when valid JSON is returned", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue(mockAttempt);
    llmAdapterMock.generate.mockResolvedValue(
      JSON.stringify({
        plan7Day: ["Solve 10 percentages questions"],
        plan14Day: ["Solve 15 percentages questions daily"],
        plan30Day: ["Review all percentages basics"],
      }),
    );

    const result = await service.generatePlans("attempt_1");

    expect(result.plan7Day).toEqual(["Solve 10 percentages questions"]);
    expect(result.plan14Day).toEqual(["Solve 15 percentages questions daily"]);
    expect(result.plan30Day).toEqual(["Review all percentages basics"]);
    expect(prismaMock.improvementPlan.upsert).toHaveBeenCalled();
  });

  it("should fallback to rule-based study plans if LLM generation fails or returns mock", async () => {
    prismaMock.testInstance.findUnique.mockResolvedValue(mockAttempt);
    llmAdapterMock.generate.mockRejectedValue(new Error("LLM failure"));

    const result = await service.generatePlans("attempt_1");

    expect(result).toBeDefined();
    expect(result.plan7Day).toBeDefined();
    expect(result.plan7Day[0]).toContain("percentages");
    expect(result.plan14Day[1]).toContain("probability");
    expect(prismaMock.improvementPlan.upsert).toHaveBeenCalled();
  });
});
