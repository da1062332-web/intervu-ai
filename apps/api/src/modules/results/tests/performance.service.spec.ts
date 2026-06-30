import { Test, TestingModule } from "@nestjs/testing";
import { PerformanceService } from "../services/performance.service";
import { PerformanceRepository } from "../repositories/performance.repository";
import { EvaluationRepository } from "../repositories/evaluation.repository";

describe("PerformanceService", () => {
  let service: PerformanceService;
  let perfRepo: PerformanceRepository;
  let evalRepo: EvaluationRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        {
          provide: PerformanceRepository,
          useValue: {
            getAggregatedPerformance: jest.fn(),
          },
        },
        {
          provide: EvaluationRepository,
          useValue: {
            findByUserIdPaginated: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
    perfRepo = module.get<PerformanceRepository>(PerformanceRepository);
    evalRepo = module.get<EvaluationRepository>(EvaluationRepository);
  });

  it("should get performance summary", async () => {
    jest.spyOn(perfRepo, "getAggregatedPerformance").mockResolvedValue({
      testsCompleted: 5,
      averageScore: 80,
      bestScore: 90,
      lastAssessmentDate: new Date(),
    });

    const result = await service.getPerformanceSummary("user-1");
    expect(result.testsCompleted).toBe(5);
    expect(result.averageScore).toBe(80);
    expect(result.bestScore).toBe(90);
  });

  it("should get paginated history", async () => {
    jest.spyOn(evalRepo, "findByUserIdPaginated").mockResolvedValue({
      items: [{ id: "eval-1", overallScore: 85 }],
      total: 1,
      page: 1,
      limit: 10,
       
    } as any);

    const result = await service.getHistory("user-1", { page: 1, limit: 10 });
    expect(result.items.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.hasNext).toBe(false);
  });
});
