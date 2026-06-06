import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionController } from "./execution.controller";
import { ExecutionService } from "../services/execution.service";
import {
  SubmitExecutionDto,
  SubmitExecutionResponseDto,
  ExecutionResultDto,
} from "@/modules/execution/dto";

describe("ExecutionController", () => {
  let controller: ExecutionController;
  let service: ExecutionService;

  const mockExecutionService = {
    submitAnswers: jest.fn(),
    getExecutionResult: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecutionController],
      providers: [
        {
          provide: ExecutionService,
          useValue: mockExecutionService,
        },
      ],
    }).compile();

    controller = module.get<ExecutionController>(ExecutionController);
    service = module.get<ExecutionService>(ExecutionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("submitTest", () => {
    it("should call submitAnswers on the service with the correct DTO", async () => {
      const dto: SubmitExecutionDto = {
        testId: "test-123",
        answers: [{ questionId: "q1", answer: "A" }],
      };

      const expectedResult: SubmitExecutionResponseDto = {
        executionId: "exec-123",
        status: "submitted",
      };

      mockExecutionService.submitAnswers.mockResolvedValue(expectedResult);

      const result = await controller.submitTest(dto);

      expect(service.submitAnswers).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("getExecutionResult", () => {
    it("should call getExecutionResult on the service with the correct id", async () => {
      const executionId = "exec-123";
      const expectedResult: ExecutionResultDto = {
        executionId,
        testId: "test-123",
        status: "submitted",
        answers: [],
        submittedAt: new Date(),
      };

      mockExecutionService.getExecutionResult.mockResolvedValue(expectedResult);

      const result = await controller.getExecutionResult(executionId);

      expect(service.getExecutionResult).toHaveBeenCalledWith(executionId);
      expect(result).toEqual(expectedResult);
    });
  });
});
