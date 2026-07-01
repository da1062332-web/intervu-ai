import { Test, TestingModule } from "@nestjs/testing";
import { AttemptHistoryService } from "./attempt-history.service";
import { AttemptHistoryRepository } from "../repositories/attempt-history.repository";

describe("AttemptHistoryService", () => {
  let service: AttemptHistoryService;
  let repository: AttemptHistoryRepository;

  beforeEach(async () => {
    const mockRepository = {
      findAttemptsByUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptHistoryService,
        { provide: AttemptHistoryRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<AttemptHistoryService>(AttemptHistoryService);
    repository = module.get<AttemptHistoryRepository>(AttemptHistoryRepository);
  });

  it("should paginate and format attempt history", async () => {
    const mockDate = new Date();

    jest.spyOn(repository, "findAttemptsByUser").mockResolvedValue({
      total: 15,
      items: [
        {
          id: "attempt1",
          createdAt: mockDate,
          status: "COMPLETED",
          testConfig: { displayName: "React Test" },
          evaluationResult: { overallScore: 85 },
        } as any,
      ],
    });

    const result = await service.getAttemptHistory("user1", 2, 10);

    expect(repository.findAttemptsByUser).toHaveBeenCalledWith({
      userId: "user1",
      skip: 10,
      take: 10,
    });

    expect(result.pagination.total).toBe(15);
    expect(result.pagination.totalPages).toBe(2);
    expect(result.pagination.page).toBe(2);

    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].assessmentName).toBe("React Test");
    expect(result.attempts[0].score).toBe(85);
  });
});
