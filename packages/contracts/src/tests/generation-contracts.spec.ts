import {
  validateTemplate,
  validateGeneratedQuestion,
  validateQuestionPool,
  validateQuestionValidation,
} from "../index";
import { ValidationError } from "../errors";

describe("Generation Contract Foundation Unit Tests", () => {
  // GEN-CON-001: Valid template accepted
  test("GEN-CON-001: Valid template accepted", () => {
    const validTemplate = {
      id: "tpl_123",
      templateKey: "time_work_01",
      conceptKey: "time_work",
      difficultyLevel: "medium",
      questionType: "mcq",
      structure: { layout: "default" },
      variableSchema: { vars: [] },
      constraints: { timeLimit: 60 },
      version: 1,
    };

    const result = validateTemplate(validTemplate);
    expect(result).toBeDefined();
    expect(result.id).toBe("tpl_123");
    expect(result.difficultyLevel).toBe("medium");
  });

  // GEN-CON-002: Missing templateKey
  test("GEN-CON-002: Missing templateKey", () => {
    const invalidTemplate = {
      id: "tpl_123",
      // templateKey is missing
      conceptKey: "time_work",
      difficultyLevel: "medium",
      questionType: "mcq",
      structure: {},
      variableSchema: {},
      constraints: {},
      version: 1,
    };

    expect(() => validateTemplate(invalidTemplate)).toThrow(ValidationError);
  });

  // GEN-CON-003: Invalid difficulty level
  test("GEN-CON-003: Invalid difficulty level", () => {
    const invalidTemplate = {
      id: "tpl_123",
      templateKey: "time_work_01",
      conceptKey: "time_work",
      difficultyLevel: "extreme", // Invalid enum value
      questionType: "mcq",
      structure: {},
      variableSchema: {},
      constraints: {},
      version: 1,
    };

    expect(() => validateTemplate(invalidTemplate)).toThrow(ValidationError);
  });

  // GEN-CON-004: Missing correctAnswer
  test("GEN-CON-004: Missing correctAnswer", () => {
    const invalidQuestion = {
      questionId: "q_123",
      templateId: "tpl_001",
      conceptKey: "time_work",
      difficultyLevel: "medium",
      questionType: "mcq",
      questionText: "If 4 workers complete a task in 6 days...",
      options: ["2", "4", "6", "8"],
      // correctAnswer is missing
      solution: "Work formula...",
      metadata: { estimatedTime: 90 },
    };

    expect(() => validateGeneratedQuestion(invalidQuestion)).toThrow(
      ValidationError,
    );
  });

  // GEN-CON-005: MCQ with no options
  test("GEN-CON-005: MCQ with no options", () => {
    const invalidQuestion = {
      questionId: "q_123",
      templateId: "tpl_001",
      conceptKey: "time_work",
      difficultyLevel: "medium",
      questionType: "mcq",
      questionText: "If 4 workers complete a task in 6 days...",
      // options is missing
      correctAnswer: "4",
      solution: "Work formula...",
      metadata: { estimatedTime: 90 },
    };

    expect(() => validateGeneratedQuestion(invalidQuestion)).toThrow(
      ValidationError,
    );

    const invalidQuestionEmptyOptions = {
      ...invalidQuestion,
      options: [], // empty options
    };
    expect(() =>
      validateGeneratedQuestion(invalidQuestionEmptyOptions),
    ).toThrow(ValidationError);

    const invalidQuestionOneOption = {
      ...invalidQuestion,
      options: ["4"], // only 1 option
    };
    expect(() => validateGeneratedQuestion(invalidQuestionOneOption)).toThrow(
      ValidationError,
    );
  });

  // GEN-CON-006: Empty question pool
  test("GEN-CON-006: Empty question pool", () => {
    const invalidPool = {
      questions: [], // Empty questions
      total: 0,
      generatedAt: "2026-06-08T10:30:34Z",
    };

    expect(() => validateQuestionPool(invalidPool)).toThrow(ValidationError);
  });

  // GEN-CON-007: Invalid timestamp
  test("GEN-CON-007: Invalid timestamp", () => {
    const invalidValidationReport = {
      questionId: "q_123",
      isValid: true,
      errors: [],
      warnings: [],
      validatedAt: "2026/06/08 10:30:34", // Not an ISO timestamp
    };

    expect(() => validateQuestionValidation(invalidValidationReport)).toThrow(
      ValidationError,
    );
  });

  // GEN-CON-008: GeneratedQuestion validation success
  test("GEN-CON-008: GeneratedQuestion validation success", () => {
    const validQuestion = {
      questionId: "q_123",
      templateId: "tpl_001",
      conceptKey: "time_work",
      difficultyLevel: "medium",
      questionType: "mcq",
      questionText: "If 4 workers complete a task in 6 days...",
      options: ["2", "4", "6", "8"],
      correctAnswer: "4",
      solution: "Work formula...",
      metadata: {
        estimatedTime: 90,
      },
    };

    const result = validateGeneratedQuestion(validQuestion);
    expect(result).toBeDefined();
    expect(result.questionId).toBe("q_123");
    expect(result.options).toEqual(["2", "4", "6", "8"]);
  });
});
