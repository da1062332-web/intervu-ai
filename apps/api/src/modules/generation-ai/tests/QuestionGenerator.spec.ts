import { QuestionGeneratorService } from "../generators/question-generator.service";
import { LLMAdapter } from "../adapters/llm-adapter.interface";

describe("QuestionGeneratorService", () => {
  let service: QuestionGeneratorService;
  let mockLlmAdapter: jest.Mocked<LLMAdapter>;

  beforeEach(() => {
    mockLlmAdapter = {
      generate: jest.fn(),
    };
    service = new QuestionGeneratorService(mockLlmAdapter);
  });

  it("should successfully generate raw response from LLM", async () => {
    mockLlmAdapter.generate.mockResolvedValue("Raw LLM response string");

    const result = await service.generate("Generate a question");

    expect(mockLlmAdapter.generate).toHaveBeenCalledWith("Generate a question");
    expect(result).toBe("Raw LLM response string");
  });

  it("should throw error if LLM returns empty string", async () => {
    mockLlmAdapter.generate.mockResolvedValue(" ");

    await expect(service.generate("Generate")).rejects.toThrow(
      "Empty response received from LLM adapter",
    );
  });

  it("should propagate LLM adapter exceptions", async () => {
    mockLlmAdapter.generate.mockRejectedValue(new Error("API Timeout"));

    await expect(service.generate("Generate")).rejects.toThrow(
      "LLM Question Generation failed: API Timeout",
    );
  });
});
