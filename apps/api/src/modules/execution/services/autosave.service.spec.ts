import { Test, TestingModule } from "@nestjs/testing";
import { AutosaveService } from "./autosave.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { ExecutionValidatorService } from "./execution-validator.service";
import { ExecutionStateService } from "./execution-state.service";
import { CandidateAnswerRepository } from "../repositories";
import { RedisCacheService } from "../../../cache/redis-cache.service";

describe("AutosaveService", () => {
  let service: AutosaveService;
  let cacheService: jest.Mocked<RedisCacheService>;
  let validator: jest.Mocked<ExecutionValidatorService>;
  let stateService: jest.Mocked<ExecutionStateService>;
  let prisma: any;

  beforeEach(async () => {
    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    validator = {
      validateAssessment: jest.fn(),
      validateOwnership: jest.fn(),
      validateSubmissionState: jest.fn(),
      validateTimer: jest.fn(),
      validateQuestion: jest.fn(),
    } as any;

    stateService = {
      restoreProgress: jest.fn(),
    } as any;

    prisma = {
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutosaveService,
        { provide: PrismaService, useValue: prisma },
        { provide: ExecutionValidatorService, useValue: validator },
        { provide: ExecutionStateService, useValue: stateService },
        { provide: CandidateAnswerRepository, useValue: {} },
        { provide: RedisCacheService, useValue: cacheService },
      ],
    }).compile();

    service = module.get<AutosaveService>(AutosaveService);
  });

  it("should return expired if timer validation fails", async () => {
    cacheService.get.mockResolvedValueOnce({
      id: "test-123",
      expiresAt: new Date(Date.now() + 10000),
    });
    cacheService.get.mockResolvedValueOnce({ remainingTimeSeconds: 50 });

    validator.validateTimer.mockReturnValue({
      isExpired: true,
      actualRemainingTime: -10,
    });

    const result = await service.saveAnswer("test-123", "user-1", {
      questionId: "q1",
      answer: "A",
      timeSpentSeconds: 10,
    });

    expect(result.status).toBe("expired");
  });

  it("should save answer and return saved status", async () => {
    cacheService.get.mockResolvedValueOnce({
      id: "test-123",
      expiresAt: new Date(Date.now() + 10000),
    });
    cacheService.get.mockResolvedValueOnce({ remainingTimeSeconds: 50 });

    validator.validateTimer.mockReturnValue({
      isExpired: false,
      actualRemainingTime: 40,
    });
    prisma.$transaction.mockResolvedValue(undefined);

    const result = await service.saveAnswer("test-123", "user-1", {
      questionId: "q1",
      answer: "A",
      timeSpentSeconds: 10,
    });

    expect(result.status).toBe("saved");
    expect(cacheService.set).toHaveBeenCalledTimes(2); // once for answer, once for state
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
