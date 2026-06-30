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

describe("SubmissionService", () => {
  let service: SubmissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionService,
        {
          provide: PrismaService,
          useValue: { $transaction: jest.fn((cb) => cb({})) },
        },
        { provide: ExecutionValidatorService, useValue: {} },
        { provide: TestInstanceRepository, useValue: {} },
        { provide: SubmissionRepository, useValue: {} },
        { provide: CandidateAnswerRepository, useValue: {} },
        { provide: SubmissionValidationService, useValue: { validateSubmission: jest.fn(() => ({ isValid: true, errors: [], missingQuestionIds: [] })) } },
        { provide: EvaluationQueueService, useValue: { enqueueSubmission: jest.fn() } },
        { provide: EVALUATION_ADAPTER, useValue: {} },
      ],
    }).compile();

    service = module.get<SubmissionService>(SubmissionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
