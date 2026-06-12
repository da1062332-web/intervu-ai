import { Test, TestingModule } from "@nestjs/testing";
import { AnswerService } from "./answer.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { ExecutionValidatorService } from "./execution-validator.service";
import { ExecutionStateService } from "./execution-state.service";
import { CandidateAnswerRepository } from "../repositories";

describe("AnswerService", () => {
  let service: AnswerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerService,
        {
          provide: PrismaService,
          useValue: { $transaction: jest.fn((cb) => cb({})) },
        },
        { provide: ExecutionValidatorService, useValue: {} },
        { provide: ExecutionStateService, useValue: {} },
        { provide: CandidateAnswerRepository, useValue: {} },
      ],
    }).compile();

    service = module.get<AnswerService>(AnswerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
