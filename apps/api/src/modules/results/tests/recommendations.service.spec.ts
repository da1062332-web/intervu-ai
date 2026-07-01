import { Test, TestingModule } from "@nestjs/testing";
import { RecommendationsService } from "../services/recommendations.service";
import { RecommendationRepository } from "../repositories/recommendation.repository";
import { ResultsService } from "../services/results.service";

describe("RecommendationsService", () => {
  let service: RecommendationsService;
  let repo: RecommendationRepository;
  let resultsService: ResultsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        {
          provide: RecommendationRepository,
          useValue: {
            findByEvaluationId: jest.fn(),
          },
        },
        {
          provide: ResultsService,
          useValue: {
            getResultDetails: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecommendationsService>(RecommendationsService);
    repo = module.get<RecommendationRepository>(RecommendationRepository);
    resultsService = module.get<ResultsService>(ResultsService);
  });

  it("should return sorted recommendations", async () => {
    const mockRecs = [
      { id: "1", priority: "LOW" },
      { id: "2", priority: "HIGH" },
      { id: "3", priority: "MEDIUM" },
    ];

    jest.spyOn(resultsService, "getResultDetails").mockResolvedValue({} as any);
    jest.spyOn(repo, "findByEvaluationId").mockResolvedValue(mockRecs as any);

    const result = await service.getRecommendations("user-1", "eval-1");
    expect(result[0].priority).toBe("HIGH");
    expect(result[1].priority).toBe("MEDIUM");
    expect(result[2].priority).toBe("LOW");
  });
});
