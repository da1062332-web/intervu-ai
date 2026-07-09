import { PromptBuilderService, PromptBuilderInput } from "../prompts/prompt-builder.service";

describe("PromptBuilderService", () => {
  let service: PromptBuilderService;

  beforeEach(() => {
    service = new PromptBuilderService();
  });

  it("should compile a prompt correctly from template and variable values", () => {
    const input: PromptBuilderInput = {
      template: {
        id: "template_123",
        name: "Aptitude Math Sum",
        description: "Simple addition template",
        conceptKey: "addition",
        difficultyLevel: "EASY",
        questionType: "mcq",
        structure: {
          questionTemplate: "What is the sum of {a} and {b}?",
        },
        variableSchema: {
          variables: [
            { name: "a", type: "number", min: 1, max: 10 },
            { name: "b", type: "number", min: 1, max: 10 },
          ],
        },
        constraints: { constraints: [] },
        solutionSchema: {
          steps: ["Add a to b"],
          finalAnswer: "a + b",
        },
      },
      variableValues: { a: 5, b: 7 },
    };

    const prompt = service.buildPrompt(input);

    expect(prompt).toContain("Aptitude Math Sum");
    expect(prompt).toContain("addition");
    expect(prompt).toContain("EASY");
    expect(prompt).toContain("a = 5");
    expect(prompt).toContain("b = 7");
    expect(prompt).toContain("What is the sum of 5 and 7?");
    expect(prompt).toContain("Concept");
    expect(prompt).toContain("Formula / Reasoning");
    expect(prompt).toContain("Step-by-Step Solution");
    expect(prompt).toContain("Final Answer");
    expect(prompt).toContain("JSON Schema");
  });
});
