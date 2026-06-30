import { BatchGenerationService } from "../generators/batch-generation.service";
import { GenerationOrchestratorService } from "../orchestrators/generation-orchestrator.service";
import { GenerationQualityService } from "../evaluators/generation-quality.service";

describe("BatchGenerationService", () => {
  let service: BatchGenerationService;
  let orchestrator: jest.Mocked<GenerationOrchestratorService>;
  let qualityEvaluator: jest.Mocked<GenerationQualityService>;

  beforeEach(() => {
    orchestrator = {
      generateQuestions: jest.fn(),
    } as any;
    qualityEvaluator = {
      evaluateBatch: jest.fn(),
    } as any;

    service = new BatchGenerationService(orchestrator, qualityEvaluator);
  });

  it("should generate questions and return a batch quality report", async () => {
    const mockQuestions = [
      { id: "q1", questionText: "Q1", answer: "A1", explanation: "E1", difficulty: "Medium" },
      { id: "q2", questionText: "Q2", answer: "A2", explanation: "E2", difficulty: "Medium" },
    ];
    orchestrator.generateQuestions.mockResolvedValue({ questions: mockQuestions, failures: [] });
    qualityEvaluator.evaluateBatch.mockResolvedValue({
      duplicateRate: 0,
      topicAccuracy: 100,
      difficultyAccuracy: 100,
      validationSuccessRate: 100,
      totalGenerated: 2,
      totalPassed: 2,
    });

    const result = await service.generateBatch({
      topic: "Percentages",
      count: 2,
      category: "Quantitative Aptitude",
      difficulty: "Medium",
    });

    expect(result.generated).toBe(2);
    expect(result.questions).toEqual(mockQuestions);
    expect(result.report.validationSuccessRate).toBe(100);
    expect(orchestrator.generateQuestions).toHaveBeenCalledWith({
      topic: "Percentages",
      count: 2,
      category: "Quantitative Aptitude",
      difficulty: "Medium",
    });
  });
});
