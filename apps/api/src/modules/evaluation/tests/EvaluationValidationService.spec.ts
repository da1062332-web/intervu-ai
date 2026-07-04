import { Test, TestingModule } from "@nestjs/testing";
import { EvaluationValidationService } from "../validation/services/evaluation-validation.service";
import { ResultGeneratorService } from "../services/result-generator.service";
import { PrismaService } from "../../../prisma/prisma.service";

describe("EvaluationValidationService", () => {
  let service: EvaluationValidationService;

  const mockResultGenerator = {
    generateResult: jest.fn().mockResolvedValue({
      id: "res_val",
      score: 5,
      percentage: 100,
      sections: [],
      analytics: {
        completionRate: 100,
        topicAccuracy: { "Quantitative Aptitude": 100 },
        difficultyAccuracy: { EASY: 100 },
      },
      recommendations: [],
    }),
  };

  const mockPrisma = {
    testInstance: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationValidationService,
        { provide: ResultGeneratorService, useValue: mockResultGenerator },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EvaluationValidationService>(EvaluationValidationService);
  });

  it("should run the validation suite and return report telemetry", async () => {
    const report = await service.runValidationSuite(5); // Run 5 mock scenarios for test speed
    expect(report).toBeDefined();
    expect(report.totalScenarios).toBe(5);
    expect(typeof report.successRate).toBe("number");
    expect(report.failures).toBeDefined();
  });
});
