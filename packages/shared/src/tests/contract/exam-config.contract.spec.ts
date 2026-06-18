import { CreateExamConfigSchema } from "../../contracts/exam-config";

describe("Exam Config Contract", () => {
  it("should PASS for valid input", () => {
    const input = {
      name: "Software Engineer Screening",
      code: "SWE_SCREENING",
      role: "Software Engineer",
      durationMinutes: 60,
      totalQuestions: 30,
    };
    const result = CreateExamConfigSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("should FAIL when durationMinutes is 0", () => {
    const input = {
      name: "Software Engineer Screening",
      code: "SWE_SCREENING",
      role: "Software Engineer",
      durationMinutes: 0,
      totalQuestions: 30,
    };
    const result = CreateExamConfigSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should FAIL when name is empty string", () => {
    const input = {
      name: "",
      code: "SWE_SCREENING",
      role: "Software Engineer",
      durationMinutes: 60,
      totalQuestions: 30,
    };
    const result = CreateExamConfigSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should FAIL when totalQuestions is negative", () => {
    const input = {
      name: "Software Engineer Screening",
      code: "SWE_SCREENING",
      role: "Software Engineer",
      durationMinutes: 60,
      totalQuestions: -5,
    };
    const result = CreateExamConfigSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("should FAIL when code is missing", () => {
    const input = {
      name: "Software Engineer Screening",
      role: "Software Engineer",
      durationMinutes: 60,
      totalQuestions: 30,
    };
    const result = CreateExamConfigSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
