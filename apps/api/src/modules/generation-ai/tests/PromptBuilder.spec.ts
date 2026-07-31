import {
  PromptBuilderService,
  PromptBuilderInput,
} from "../prompts/prompt-builder.service";

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

  it("should instruct the model to avoid obviously wrong distractors", () => {
    const input: PromptBuilderInput = {
      template: {
        id: "template_456",
        name: "Verbal Reasoning",
        description: "Distractor quality template",
        conceptKey: "reasoning",
        difficultyLevel: "MEDIUM",
        questionType: "mcq",
        structure: {
          questionTemplate: "Choose the best explanation.",
        },
        variableSchema: { variables: [] },
        constraints: { constraints: [] },
        solutionSchema: {
          steps: ["Reason through the options"],
          finalAnswer: "Option B",
        },
      },
      variableValues: {},
    };

    const prompt = service.buildPrompt(input);
    expect(prompt.toLowerCase()).toContain("avoid obviously wrong options");
  });

  it("should require exact answer computation when correctAnswer is missing", () => {
    const input: PromptBuilderInput = {
      template: {
        id: "template_789",
        name: "Exact Answer Requirement",
        description: "Ensure correct answer is computed from variables",
        conceptKey: "math",
        difficultyLevel: "HARD",
        questionType: "mcq",
        structure: {
          questionTemplate: "Compute the result of {a} + {b}.",
        },
        variableSchema: { variables: [] },
        constraints: { constraints: [] },
        solutionSchema: {
          steps: ["Add a and b to find the answer"],
          finalAnswer: "a + b",
        },
      },
      variableValues: { a: 3, b: 4 },
    };

    const prompt = service.buildPrompt(input);
    expect(prompt).toContain("compute it exactly from the provided parameter values");
    expect(prompt).not.toContain("do not perform any mathematical calculations unless");
  });

  it("should preserve integer variable display while formatting decimal variables", () => {
    const input: PromptBuilderInput = {
      template: {
        id: "template_display",
        name: "Display Formatting",
        description: "Format values for candidate-facing text",
        conceptKey: "compound_interest",
        difficultyLevel: "MEDIUM",
        questionType: "mcq",
        structure: {
          questionTemplate:
            "Principal {principal_amount}; interest Rs. {yearly_interest}.",
        },
        variableSchema: { variables: [] },
        constraints: { constraints: [] },
        solutionSchema: {
          steps: ["Use compound interest"],
          correctVariable: "principal_amount",
        },
      },
      variableValues: {
        principal_amount: 10000,
        yearly_interest: 3245.4016875000007,
        growth_rate: 12.3456,
      },
    };
    input.template.structure.questionTemplate =
      "Principal {principal_amount}; interest Rs. {yearly_interest}; growth {growth_rate}%.";

    const prompt = service.buildPrompt(input);

    expect(prompt).toContain("Principal 10000; interest Rs. 3245; growth 12.35%.");
    expect(prompt).not.toContain("interest Rs. 3245.40");
    expect(prompt).toContain("principal_amount = 10000");
    expect(prompt).toContain("yearly_interest = 3245.40");
    expect(prompt).toContain("growth_rate = 12.35");
    expect(prompt).toContain(
      '"variables": {"principal_amount":10000,"yearly_interest":3245.4016875000007,"growth_rate":12.3456}',
    );
  });
});
