 
import { AntiRepetitionService } from "./anti-repetition.service";
import { MockSemanticSimilarityProvider } from "../providers/mock-semantic-similarity.provider";
import { QuestionPoolRepository } from "../repositories/question-pool.repository";

describe("AntiRepetitionService", () => {
  let service: AntiRepetitionService;
  let repo: jest.Mocked<QuestionPoolRepository>;

  beforeEach(() => {
    repo = {
      getQuestionsByIds: jest.fn(),
    } as unknown as any;

    service = new AntiRepetitionService(
      new MockSemanticSimilarityProvider(),
      repo,
    );
  });

  it("should filter exact matches", async () => {
    repo.getQuestionsByIds.mockResolvedValue([
      { id: "h1", text: "What is React?" } as unknown as any,
    ]);

    const pool = [{ id: "h1" }, { id: "new1", text: "What is Vue?" }];
    const result = await service.filterPool(pool, ["h1"], []);

    expect(result).toHaveLength(1);
    expect((result[0] as unknown as any).id).toBe("new1");
  });

  it("should filter semantic matches", async () => {
    repo.getQuestionsByIds.mockResolvedValue([
      { id: "h1", text: "What is React JS?" } as unknown as any,
    ]);

    const pool = [
      { id: "c1", text: "What is React JS?" },
      { id: "c2", text: "What is Vue?" },
    ];

    // Very similar texts so jaccard will be > 0.85
    const result = await service.filterPool(pool, ["h1"], []);

    expect(result).toHaveLength(1);
    expect((result[0] as unknown as any).id).toBe("c2");
  });
});
