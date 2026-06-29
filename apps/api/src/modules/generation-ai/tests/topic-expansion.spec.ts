import { TopicExpansionService } from "../generators/topic-expansion.service";
import { LLMAdapter } from "../adapters/llm-adapter.interface";

describe("TopicExpansionService", () => {
  let service: TopicExpansionService;
  let llmAdapter: jest.Mocked<LLMAdapter>;

  beforeEach(() => {
    llmAdapter = {
      generate: jest.fn(),
    };
    service = new TopicExpansionService(llmAdapter);
  });

  it("should expand topic using the LLM adapter", async () => {
    llmAdapter.generate.mockResolvedValue('["Topic A", "Topic B", "Topic C"]');

    const result = await service.expandTopic("Percentages");
    expect(result).toEqual(["Topic A", "Topic B", "Topic C"]);
    expect(llmAdapter.generate).toHaveBeenCalled();
  });

  it("should return fallback values if the LLM output is not valid JSON", async () => {
    llmAdapter.generate.mockResolvedValue("invalid json string");

    const result = await service.expandTopic("Percentages");
    expect(result).toEqual([
      "Basic Percentages",
      "Profit Loss",
      "Discounts",
      "Successive Percentage",
      "Percentage Change",
    ]);
  });
});
