import { Test, TestingModule } from "@nestjs/testing";
import { ResumeService } from "./resume.service";
import { ExecutionValidatorService } from "./execution-validator.service";
import { ExecutionStateService } from "./execution-state.service";
import { CandidateAnswerRepository } from "../repositories";

describe("ResumeService", () => {
  let service: ResumeService;
  let validator: jest.Mocked<ExecutionValidatorService>;
  let stateService: jest.Mocked<ExecutionStateService>;
  let answerRepo: jest.Mocked<CandidateAnswerRepository>;

  beforeEach(async () => {
    validator = {
      validateAssessment: jest.fn(),
      validateOwnership: jest.fn(),
    } as any;

    stateService = {
      restoreProgress: jest.fn(),
    } as any;

    answerRepo = {
      findAll: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResumeService,
        { provide: ExecutionValidatorService, useValue: validator },
        { provide: ExecutionStateService, useValue: stateService },
        { provide: CandidateAnswerRepository, useValue: answerRepo },
      ],
    }).compile();

    service = module.get<ResumeService>(ResumeService);
  });

  it("should resume assessment and return state", async () => {
    validator.validateAssessment.mockResolvedValue({ status: "IN_PROGRESS" } as any);
    validator.validateOwnership.mockReturnValue(undefined);
    stateService.restoreProgress.mockResolvedValue({
      currentQuestionIndex: 2,
      remainingTimeSeconds: 1500,
    } as any);
    answerRepo.findAll.mockResolvedValue([
      { questionId: "q1", answer: "A", timeSpentSeconds: 30, isMarkedForReview: false, savedAt: new Date() },
    ] as any);

    const result = await service.resumeAssessment("test-123", "user-1");

    expect(result.testInstanceId).toBe("test-123");
    expect(result.status).toBe("IN_PROGRESS");
    expect(result.executionState?.currentQuestionIndex).toBe(2);
    expect(result.answers.length).toBe(1);
    expect(result.answers[0].questionId).toBe("q1");
    expect(validator.validateAssessment).toHaveBeenCalledWith("test-123");
  });
});
