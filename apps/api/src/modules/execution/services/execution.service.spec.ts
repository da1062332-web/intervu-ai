import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ExecutionService } from "./execution.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";

import { SubmitExecutionDto, ExecutionResultDto } from "@/modules/execution/dto";

describe("ExecutionService", () => {
  let service: ExecutionService;

  const mockRedisCacheService = {
    hasExecutionForTest: jest.fn(),
    setExecution: jest.fn(),
    setExecutionForTest: jest.fn(),
    getExecution: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionService,
        {
          provide: RedisCacheService,
          useValue: mockRedisCacheService,
        },
      ],
    }).compile();

    service = module.get<ExecutionService>(ExecutionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("submitAnswers", () => {
    it("should successfully submit answers", async () => {
      const dto: SubmitExecutionDto = {
        testId: "test-1",
        answers: [{ questionId: "q1", answer: "A" }],
      };

      mockRedisCacheService.hasExecutionForTest.mockResolvedValue(false);
      mockRedisCacheService.setExecution.mockResolvedValue(true);
      mockRedisCacheService.setExecutionForTest.mockResolvedValue(true);

      const result = await service.submitAnswers(dto);

      expect(result).toBeDefined();
      expect(result.status).toBe("submitted");
      expect(result.executionId).toBeDefined();

      expect(mockRedisCacheService.setExecution).toHaveBeenCalledTimes(1);
      expect(mockRedisCacheService.setExecutionForTest).toHaveBeenCalledTimes(1);
    });

    it("should throw BadRequestException if testId is missing", async () => {
      const dto = {
        answers: [{ questionId: "q1", answer: "A" }],
      } as SubmitExecutionDto;

      await expect(service.submitAnswers(dto)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if answers are empty", async () => {
      const dto: SubmitExecutionDto = {
        testId: "test-1",
        answers: [],
      };

      await expect(service.submitAnswers(dto)).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException for duplicate questionIds", async () => {
      const dto: SubmitExecutionDto = {
        testId: "test-1",
        answers: [
          { questionId: "q1", answer: "A" },
          { questionId: "q1", answer: "B" },
        ],
      };

      await expect(service.submitAnswers(dto)).rejects.toThrow(BadRequestException);
    });

    it("should throw ConflictException if duplicate submission detected", async () => {
      const dto: SubmitExecutionDto = {
        testId: "test-1",
        answers: [{ questionId: "q1", answer: "A" }],
      };

      mockRedisCacheService.hasExecutionForTest.mockResolvedValue(true);

      await expect(service.submitAnswers(dto)).rejects.toThrow(ConflictException);
    });

    it("should throw ServiceUnavailableException if Redis set fails", async () => {
      const dto: SubmitExecutionDto = {
        testId: "test-1",
        answers: [{ questionId: "q1", answer: "A" }],
      };

      mockRedisCacheService.hasExecutionForTest.mockResolvedValue(false);
      mockRedisCacheService.setExecution.mockResolvedValue(false);

      await expect(service.submitAnswers(dto)).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe("getExecutionResult", () => {
    it("should successfully return an execution result", async () => {
      const executionId = "exec-1";
      const expectedResult: ExecutionResultDto = {
        executionId,
        testId: "test-1",
        status: "submitted",
        answers: [],
        submittedAt: new Date(),
      };

      mockRedisCacheService.getExecution.mockResolvedValue(expectedResult);

      const result = await service.getExecutionResult(executionId);

      expect(result).toEqual(expectedResult);
      expect(mockRedisCacheService.getExecution).toHaveBeenCalledWith(executionId);
    });

    it("should throw NotFoundException if execution is not found", async () => {
      const executionId = "exec-1";

      mockRedisCacheService.getExecution.mockResolvedValue(null);

      await expect(service.getExecutionResult(executionId)).rejects.toThrow(NotFoundException);
    });
  });
});
