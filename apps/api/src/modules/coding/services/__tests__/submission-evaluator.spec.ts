import { SubmissionEvaluatorService } from "../submission-evaluator.service";
import { JudgeService } from "../judge.service";
import { OracleRegistry } from "../../oracles/oracle.registry";
import { MathPrimeCheckOracle } from "../../oracles/standard-oracles";
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

    const primeOracle = new MathPrimeCheckOracle();
    oracleRegistry = new OracleRegistry([primeOracle]);

    evaluatorService = new SubmissionEvaluatorService(mockJudgeService, oracleRegistry);
  });

  it("should return ACCEPTED and 100% score when all test suites pass", async () => {
    mockJudgeService.submitAndPoll.mockImplementation(async (opts: any) => {
      // Simulate stdout matching expected stdin
      const inputStr = opts.stdin.trim();
      const num = parseInt(inputStr, 10);
      const isPrime = num === 7 || num === 13 || num === 2 || num === 997 || num === 1000003;
      return {
        token: "tok-1",
        statusId: 3,
        statusDescription: "Accepted",
        stdout: isPrime ? "true" : "false",
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
      code: "def is_prime(n):\n    pass\n",
      language: "python",
    };

    const codingData = {
      oracleKey: "MATH_PRIME_CHECK_ORACLE",
      publicTests: [{ input: { n: 7 }, expectedOutput: { result: true } }],
      hiddenTests: [{ input: { n: 10 }, expectedOutput: { result: false } }],
      boundaryTests: [{ input: { n: 2 }, expectedOutput: { result: true } }],
      stressTests: [{ input: { n: 1000003 }, expectedOutput: { result: true } }],
    };

    const res = await evaluatorService.evaluateSubmission(dto, codingData, "Prime Check", false);

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
      // Simulate incorrect output for hidden test
      const inputStr = opts.stdin.trim();
      const num = parseInt(inputStr, 10);
      const isPass = num === 7;
      return {
        token: "tok-2",
        statusId: 3,
        statusDescription: "Accepted",
        stdout: isPass ? "true" : "wrong_output",
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
      code: "def is_prime(n):\n    return True\n",
      language: "python",
    };

    const codingData = {
      oracleKey: "MATH_PRIME_CHECK_ORACLE",
      publicTests: [{ input: { n: 7 }, expectedOutput: { result: true } }],
      hiddenTests: [{ input: { n: 10 }, expectedOutput: { result: false } }],
    };

    const res = await evaluatorService.evaluateSubmission(dto, codingData, "Prime Check", false);

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

    const res = await evaluatorService.evaluateSubmission(dto, {}, "Prime Check", false);

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

    const res = await evaluatorService.evaluateSubmission(dto, {}, "Prime Check", false);

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

    const res = await evaluatorService.evaluateSubmission(dto, {}, "Prime Check", false);

    expect(res.verdict).toBe("MEMORY_LIMIT_EXCEEDED");
    expect(res.score).toBe(0);
  });
});
