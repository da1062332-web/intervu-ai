import { ValidationOrchestratorService } from "../validation-orchestrator.service";
import { GeneratedQuestionDto } from "@intervu-ai/contracts";

describe("Question Validation & Quality Assurance Engine Unit Tests", () => {
  let orchestrator: ValidationOrchestratorService;

  beforeEach(() => {
    orchestrator = new ValidationOrchestratorService();
  });

  const baseValidMCQ: GeneratedQuestionDto = {
    questionId: "q_val_001",
    templateId: "tpl_val_001",
    conceptKey: "percentages",
    difficultyLevel: "easy",
    questionType: "mcq",
    questionText: "If the price of petrol is increased by 25%, by how much percent must a motorist reduce the consumption of petrol?",
    options: ["15", "20", "22", "30"],
    correctAnswer: "20",
    solution: JSON.stringify({
      steps: ["New price is 125.", "Reduction = (25 / 125) * 100 = 20%."],
      finalAnswer: "20",
    }),
    metadata: { percent_increase: 25, steps: 2 },
  };

  test("VAL-001: should pass a perfectly valid question with score >= 80", () => {
    const report = orchestrator.validateQuestion(baseValidMCQ);
    expect(report.passed).toBe(true);
    expect(report.isValid).toBe(true);
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.errors.length).toBe(0);
  });

  test("VAL-002: should reject when question text is missing", () => {
    const invalidQuestion = {
      ...baseValidMCQ,
      questionText: "",
    };
    const report = orchestrator.validateQuestion(invalidQuestion as unknown as GeneratedQuestionDto);
    expect(report.passed).toBe(false);
    expect(report.score).toBe(0); // Structure validation fails -> 0
    expect(report.errors.some((e) => e.code === "MISSING_QUESTION_TEXT")).toBe(true);
  });

  test("VAL-003: should reject when correct answer is missing", () => {
    const invalidQuestion = {
      ...baseValidMCQ,
      correctAnswer: "",
    };
    const report = orchestrator.validateQuestion(invalidQuestion as unknown as GeneratedQuestionDto);
    expect(report.passed).toBe(false);
    expect(report.errors.some((e) => e.code === "MISSING_ANSWER")).toBe(true);
  });

  test("VAL-004: should reject when solution is missing", () => {
    const invalidQuestion = {
      ...baseValidMCQ,
      solution: "",
    };
    const report = orchestrator.validateQuestion(invalidQuestion as unknown as GeneratedQuestionDto);
    expect(report.passed).toBe(false);
    expect(report.errors.some((e) => e.code === "MISSING_SOLUTION")).toBe(true);
  });

  test("VAL-005: should reject when difficulty steps mismatch", () => {
    // Assigned as easy (requires 1-2 steps) but solution has 5 steps
    const invalidQuestion: GeneratedQuestionDto = {
      ...baseValidMCQ,
      difficultyLevel: "easy",
      solution: JSON.stringify({
        steps: ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
        finalAnswer: "20",
      }),
      metadata: { steps: 5 },
    };
    const report = orchestrator.validateQuestion(invalidQuestion);
    expect(report.passed).toBe(false);
    expect(report.errors.some((e) => e.code === "INVALID_DIFFICULTY")).toBe(true);
  });

  test("VAL-006: should reject when question is ambiguous (unresolved placeholders)", () => {
    const invalidQuestion = {
      ...baseValidMCQ,
      questionText: "What is {unresolved_param} of 200?", // missing in metadata
    };
    const report = orchestrator.validateQuestion(invalidQuestion);
    expect(report.passed).toBe(false);
    expect(report.errors.some((e) => e.code === "AMBIGUOUS_QUESTION")).toBe(true);
  });

  test("VAL-007: should reject when MCQ options are invalid", () => {
    const invalidQuestion = {
      ...baseValidMCQ,
      options: ["10", "15", "30", "35"], // missing correct answer "20"
    };
    const report = orchestrator.validateQuestion(invalidQuestion);
    expect(report.passed).toBe(false);
    expect(report.errors.some((e) => e.code === "INVALID_MCQ_OPTIONS")).toBe(true);
  });

  test("VAL-008: should reject due to quality failure (too short)", () => {
    const invalidQuestion = {
      ...baseValidMCQ,
      questionText: "Short?", // Less than 15 chars
    };
    const report = orchestrator.validateQuestion(invalidQuestion);
    expect(report.passed).toBe(false);
    expect(report.errors.some((e) => e.code === "QUALITY_FAILURE")).toBe(true);
  });

  test("VAL-009: should pass validation when score is >= 80", () => {
    const report = orchestrator.validateQuestion(baseValidMCQ);
    expect(report.passed).toBe(true);
    expect(report.score).toBe(100);
  });

  test("VAL-010: should fail validation when score is < 80", () => {
    const invalidQuestion = {
      ...baseValidMCQ,
      questionText: "Short?",
      options: ["10", "15"], // invalid length
    };
    const report = orchestrator.validateQuestion(invalidQuestion as unknown as GeneratedQuestionDto);
    expect(report.passed).toBe(false);
    expect(report.score).toBeLessThan(80);
  });

  test("VAL-011: should support bulk validation", () => {
    const questions = [baseValidMCQ, baseValidMCQ];
    const reports = orchestrator.validateQuestions(questions);
    expect(reports.length).toBe(2);
    expect(reports[0].passed).toBe(true);
    expect(reports[1].passed).toBe(true);
  });

  test("Performance: should validate 100 questions in under 3 seconds", () => {
    const questions: GeneratedQuestionDto[] = [];
    for (let i = 0; i < 100; i++) {
      const steps = i % 3 === 0 ? 1 : i % 3 === 1 ? 2 : 4;
      const difficultyLevel = i % 3 === 0 ? "easy" : i % 3 === 1 ? "medium" : "hard";

      questions.push({
        questionId: `q_perf_${i}`,
        templateId: "tpl_val_001",
        conceptKey: "percentages",
        difficultyLevel,
        questionType: "mcq",
        questionText: `This is a sample question number ${i} to test performance of validation.`,
        options: ["10", "20", "30", "40"],
        correctAnswer: "20",
        solution: JSON.stringify({
          steps: Array(steps).fill("").map((_, idx) => `Step ${idx + 1}`),
          finalAnswer: "20",
        }),
        metadata: { percent_increase: 25, steps },
      });
    }

    const start = Date.now();
    const reports = orchestrator.validateQuestions(questions);
    const duration = Date.now() - start;

    expect(reports.length).toBe(100);
    expect(duration).toBeLessThan(3000); // 3 seconds = 3000ms
    console.log(`[Performance Report] Validated 100 questions in ${duration}ms`);
  });
});
