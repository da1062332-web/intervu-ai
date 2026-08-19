import { SubmissionEvaluatorService } from "../submission-evaluator.service";
import { JudgeService } from "../judge.service";
import { OracleRegistry } from "../../oracles/oracle.registry";
import { BasicGradeCalculatorOracle } from "../../oracles/basic-grade-calculator.oracle";
import { SubmitCodeDto } from "../../dto/submit-code.dto";

describe("SubmissionEvaluatorService Unit Tests", () => {
  let evaluatorService: SubmissionEvaluatorService;
  let mockJudgeService: jest.Mocked<JudgeService>;
  let oracleRegistry: OracleRegistry;

  beforeEach(() => {
    mockJudgeService = {
      submitAndPoll: jest.fn(),
      getJudge0Url: jest.fn().mockReturnValue("http://localhost:2358"),
      mapLanguageToId: jest.fn().mockReturnValue(71),
      checkHealth: jest.fn().mockResolvedValue({ healthy: true }),
    } as any;

    const gradeOracle = new BasicGradeCalculatorOracle();
    oracleRegistry = new OracleRegistry([gradeOracle]);

    evaluatorService = new SubmissionEvaluatorService(mockJudgeService, oracleRegistry);
  });

  it("should return ACCEPTED and 100% score when all test suites pass", async () => {
    mockJudgeService.submitAndPoll.mockImplementation(async (opts: any) => {
      const raw = opts.stdin.trim();
      let score = parseInt(raw, 10);
      if (isNaN(score)) {
        try {
          const parsed = JSON.parse(raw);
          score = typeof parsed === "number" ? parsed : (parsed.score ?? 85);
        } catch {
          score = 85;
        }
      }
      const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
      return {
        token: "tok-1",
        statusId: 3,
        statusDescription: "Accepted",
        stdout: grade,
        stderr: "",
        compileOutput: "",
        message: "",
        time: 0.012,
        memory: 12400,
        error: null,
      };
    });

    const dto: SubmitCodeDto = {
      questionId: "q10",
      testInstanceId: "inst-1",
      code: "def grade(score):\n    pass\n",
      language: "python",
    };

    const codingData = {
      oracleKey: "BASIC_GRADE_CALCULATOR_ORACLE",
      publicTests: [{ input: { score: 85 }, expectedOutput: { grade: "B", result: "B" } }],
      hiddenTests: [{ input: { score: 55 }, expectedOutput: { grade: "F", result: "F" } }],
      boundaryTests: [{ input: { score: 90 }, expectedOutput: { grade: "A", result: "A" } }],
      stressTests: [{ input: { score: 100 }, expectedOutput: { grade: "A", result: "A" } }],
    };

    const res = await evaluatorService.evaluateSubmission(dto, codingData, "Grade Calculator", false);

    expect(res.verdict).toBe("ACCEPTED");
    expect(res.score).toBe(100);
    expect(res.totalTests).toBe(4);
    expect(res.passedTests).toBe(4);
    expect(res.failedTests).toBe(0);
    expect(res.categories.public.passed).toBe(1);
    expect(res.categories.hidden.passed).toBe(1);
    expect(res.categories.boundary.passed).toBe(1);
    expect(res.categories.stress.passed).toBe(1);

    // SECURITY CHECK: Verify private test inputs/outputs are NOT attached to internal results
    for (const r of res.results) {
      expect((r as any).input).toBeUndefined();
      expect((r as any).expectedOutput).toBeUndefined();
    }
  });

  it("should return WRONG_ANSWER and score < 100 when one or more test cases fail", async () => {
    mockJudgeService.submitAndPoll.mockImplementation(async (opts: any) => {
      let score = 85;
      try {
        const parsed = JSON.parse(opts.stdin);
        score = typeof parsed.score === "number" ? parsed.score : 85;
      } catch {
        const parsedNum = parseInt(opts.stdin.trim(), 10);
        if (!isNaN(parsedNum)) score = parsedNum;
      }
      const isPass = score === 85;
      return {
        token: "tok-2",
        statusId: 3,
        statusDescription: "Accepted",
        stdout: isPass ? "B" : "WRONG",
        stderr: "",
        compileOutput: "",
        message: "",
        time: 0.015,
        memory: 12000,
        error: null,
      };
    });

    const dto: SubmitCodeDto = {
      questionId: "q10",
      testInstanceId: "inst-1",
      code: "def grade(score):\n    return 'A'\n",
      language: "python",
    };

    const codingData = {
      oracleKey: "BASIC_GRADE_CALCULATOR_ORACLE",
      publicTests: [{ input: { score: 85 }, expectedOutput: { grade: "B", result: "B" } }],
      hiddenTests: [{ input: { score: 55 }, expectedOutput: { grade: "F", result: "F" } }],
    };

    const res = await evaluatorService.evaluateSubmission(dto, codingData, "Grade Calculator", false);

    expect(res.verdict).toBe("WRONG_ANSWER");
    expect(res.score).toBeLessThan(100);
    expect(res.failedTests).toBeGreaterThan(0);
  });

  it("should return COMPILE_ERROR when statusId 6 is returned by Judge0", async () => {
    mockJudgeService.submitAndPoll.mockResolvedValue({
      token: "tok-3",
      statusId: 6,
      statusDescription: "Compilation Error",
      stdout: "",
      stderr: "SyntaxError: invalid syntax",
      compileOutput: "SyntaxError: invalid syntax",
      message: "",
      time: null,
      memory: null,
      error: "SyntaxError: invalid syntax",
    });

    const dto: SubmitCodeDto = {
      questionId: "q10",
      testInstanceId: "inst-1",
      code: "invalid code",
      language: "python",
    };

    const codingData = {
      oracleKey: "BASIC_GRADE_CALCULATOR_ORACLE",
      publicTests: [{ input: { score: 85 }, expectedOutput: { grade: "B" } }],
    };

    const res = await evaluatorService.evaluateSubmission(dto, codingData, "Grade Calculator", false);

    expect(res.verdict).toBe("COMPILE_ERROR");
    expect(res.score).toBe(0);
    expect(res.errorMessage).toContain("SyntaxError");
  });

  it("should return TIME_LIMIT_EXCEEDED when statusId 5 is returned by Judge0", async () => {
    mockJudgeService.submitAndPoll.mockResolvedValue({
      token: "tok-4",
      statusId: 5,
      statusDescription: "Time Limit Exceeded",
      stdout: "",
      stderr: "",
      compileOutput: "",
      message: "",
      time: 5.0,
      memory: 15000,
      error: "Time Limit Exceeded",
    });

    const dto: SubmitCodeDto = {
      questionId: "q10",
      testInstanceId: "inst-1",
      code: "while True: pass",
      language: "python",
    };

    const codingData = {
      oracleKey: "BASIC_GRADE_CALCULATOR_ORACLE",
      publicTests: [{ input: { score: 85 }, expectedOutput: { grade: "B" } }],
    };

    const res = await evaluatorService.evaluateSubmission(dto, codingData, "Grade Calculator", false);

    expect(res.verdict).toBe("TIME_LIMIT_EXCEEDED");
    expect(res.score).toBe(0);
  });

  it("should return MEMORY_LIMIT_EXCEEDED when statusId 12 is returned by Judge0", async () => {
    mockJudgeService.submitAndPoll.mockResolvedValue({
      token: "tok-5",
      statusId: 12,
      statusDescription: "Memory Limit Exceeded",
      stdout: "",
      stderr: "",
      compileOutput: "",
      message: "",
      time: 0.1,
      memory: 2048000,
      error: "Memory Limit Exceeded",
    });

    const dto: SubmitCodeDto = {
      questionId: "q10",
      testInstanceId: "inst-1",
      code: "a = [0] * 1000000000",
      language: "python",
    };

    const codingData = {
      oracleKey: "BASIC_GRADE_CALCULATOR_ORACLE",
      publicTests: [{ input: { score: 85 }, expectedOutput: { grade: "B" } }],
    };

    const res = await evaluatorService.evaluateSubmission(dto, codingData, "Grade Calculator", false);

    expect(res.verdict).toBe("MEMORY_LIMIT_EXCEEDED");
    expect(res.score).toBe(0);
  });
});
