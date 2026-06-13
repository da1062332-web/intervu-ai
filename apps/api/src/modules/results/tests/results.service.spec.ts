import { Test, TestingModule } from "@nestjs/testing";
import { ResultsService } from "../services/results.service";
import { EvaluationRepository } from "../repositories/evaluation.repository";
import {
  ResultNotFoundError,
  UnauthorizedResultAccessError,
} from "@intervu/shared";

describe("ResultsService", () => {
  let service: ResultsService;
  let repo: EvaluationRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        {
          provide: EvaluationRepository,
          useValue: {
            findEvaluationWithDetails: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ResultsService>(ResultsService);
    repo = module.get<EvaluationRepository>(EvaluationRepository);
  });

  it("should return result details for authorized user", async () => {
    const mockEval = { id: "1", userId: "user-1", skillScores: [] };

    jest
      .spyOn(repo, "findEvaluationWithDetails")
      .mockResolvedValue(mockEval as never);

    const result = await service.getResultDetails("user-1", "1");
    expect(result).toBeDefined();
    expect(result.id).toBe("1");
  });

  it("should throw ResultNotFoundError if evaluation does not exist", async () => {
    jest.spyOn(repo, "findEvaluationWithDetails").mockResolvedValue(null);
    await expect(
      service.getResultDetails("user-1", "invalid-id"),
    ).rejects.toThrow(ResultNotFoundError);
  });

  it("should throw UnauthorizedResultAccessError if user does not own evaluation", async () => {
    const mockEval = { id: "1", userId: "user-2", skillScores: [] };

    jest
      .spyOn(repo, "findEvaluationWithDetails")
      .mockResolvedValue(mockEval as never);

    await expect(service.getResultDetails("user-1", "1")).rejects.toThrow(
      UnauthorizedResultAccessError,
    );
  });
});
