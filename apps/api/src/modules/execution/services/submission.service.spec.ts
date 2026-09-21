import { Test, TestingModule } from "@nestjs/testing";
import { SubmissionService } from "./submission.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { ExecutionValidatorService } from "./execution-validator.service";
import { SubmissionValidationService } from "./submission-validation.service";
import { EvaluationQueueService } from "../../evaluation/services/evaluation-queue.service";
import {
  TestInstanceRepository,
  SubmissionRepository,
  CandidateAnswerRepository,
} from "../repositories";
import { EVALUATION_ADAPTER } from "../interfaces/evaluation-adapter.interface";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { BadRequestException } from "@nestjs/common";

describe("SubmissionService", () => {
  let service: SubmissionService;
  let prisma: any;
  let validator: any;
  let validationService: any;
  let testInstanceRepo: any;
  let cacheService: any;

  beforeEach(async () => {
    prisma = {
      submission: {
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: "sub-1", status: "SUBMITTED" }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      testInstance: {
        findUnique: jest.fn().mockResolvedValue({ id: "inst-1", status: "IN_PROGRESS", examConfigId: "cfg-1" }),
      },
      assessmentEvent: {
        create: jest.fn().mockResolvedValue({ id: "event-1" }),
      },
      candidateAnswer: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(async (cb) => {
        return cb({
          submission: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockImplementation((args) => ({
              id: "sub-1",
              status: args.data.status,
              ...args.data,
            })),
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          assessmentEvent: {
            create: jest.fn().mockResolvedValue({ id: "event-1" }),
          },
        });
      }),
    };

    validator = {
      validateAssessment: jest.fn().mockResolvedValue({ id: "inst-1", status: "IN_PROGRESS", examConfigId: "cfg-1" }),
      validateOwnership: jest.fn(),
      validateSubmissionState: jest.fn(),
    };

    validationService = {
      validateSubmission: jest.fn().mockResolvedValue({
        isValid: true,
        errors: [],
        missingQuestionIds: [],
        isExpired: false,
        isDuplicate: false,
      }),
    };

    testInstanceRepo = {
      withTransaction: jest.fn().mockReturnValue({
        update: jest.fn().mockResolvedValue({ id: "inst-1" }),
      }),
    };

    cacheService = {
      acquireLock: jest.fn().mockResolvedValue(true),
      releaseLock: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        { provide: PrismaService, useValue: prisma },
        { provide: ExecutionValidatorService, useValue: validator },
        { provide: TestInstanceRepository, useValue: testInstanceRepo },
        { provide: SubmissionRepository, useValue: {} },
        { provide: CandidateAnswerRepository, useValue: { findAll: jest.fn().mockResolvedValue([]) } },
        { provide: SubmissionValidationService, useValue: validationService },
        { provide: EvaluationQueueService, useValue: { enqueueSubmission: jest.fn().mockResolvedValue(undefined) } },
        { provide: RedisCacheService, useValue: cacheService },
        { provide: EVALUATION_ADAPTER, useValue: { triggerEvaluation: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should record normal SUBMITTED status when a candidate submits early with allowPartial: true", async () => {
    // Simulate candidate having unanswered questions
    validationService.validateSubmission.mockResolvedValue({
      isValid: false,
      errors: ["Missing Answers: 10 required questions have not been answered."],
      missingQuestionIds: ["q1", "q2"],
      isExpired: false,
      isDuplicate: false,
    });

    const repoMock = { update: jest.fn().mockResolvedValue({}) };
    testInstanceRepo.withTransaction.mockReturnValue(repoMock);

    const result = await service.submitAssessment(
      "inst-1",
      "user-1",
      false, // isAutoSubmit = false (manual submission!)
      "USER",
      "USER_SUBMIT",
      undefined,
      true, // allowPartial = true
    );

    // Verify it updated test instance to SUBMITTED (NOT AUTO_SUBMITTED)
    expect(repoMock.update).toHaveBeenCalledWith("inst-1", expect.objectContaining({
      status: "SUBMITTED",
    }));

    expect(result.status).toBe("SUBMITTED");
  });

  it("should throw MISSING_ANSWERS when allowPartial: false and candidate has unanswered questions", async () => {
    validationService.validateSubmission.mockResolvedValue({
      isValid: false,
      errors: ["Missing Answers: 5 required questions have not been answered."],
      missingQuestionIds: ["q1", "q2", "q3", "q4", "q5"],
      isExpired: false,
      isDuplicate: false,
    });

    await expect(
      service.submitAssessment(
        "inst-1",
        "user-1",
        false, // isAutoSubmit = false
        "USER",
        "USER_SUBMIT",
        undefined,
        false, // allowPartial = false
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it("should record AUTO_SUBMITTED status when isAutoSubmit: true (system timeout/kick)", async () => {
    validationService.validateSubmission.mockResolvedValue({
      isValid: true,
      errors: [],
      missingQuestionIds: [],
      isExpired: true,
      isDuplicate: false,
    });

    const repoMock = { update: jest.fn().mockResolvedValue({}) };
    testInstanceRepo.withTransaction.mockReturnValue(repoMock);

    const result = await service.submitAssessment(
      "inst-1",
      "user-1",
      true, // isAutoSubmit = true
      "TIMEOUT",
      "TIME_EXPIRED",
    );

    // Must update test instance to AUTO_SUBMITTED
    expect(repoMock.update).toHaveBeenCalledWith("inst-1", expect.objectContaining({
      status: "AUTO_SUBMITTED",
    }));

    expect(result.status).toBe("EXPIRED_AND_SUBMITTED");
  });
});
