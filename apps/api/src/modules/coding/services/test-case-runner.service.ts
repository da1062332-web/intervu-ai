import { Injectable } from "@nestjs/common";
import { randomBytes } from "crypto";
import { CodeHarnessService, MultiCaseOutput } from "./code-harness.service";
import {
  JudgeBatchItemResult,
  JudgeBatchOptions,
  JudgeService,
  NormalizedJudgeResult,
} from "./judge.service";

export interface TestCaseSpec {
  /** Raw test input (object, array, scalar or JSON string). */
  input: any;
  /** Expected output already formatted for Judge0 (per-case mode only). */
  expectedOutput?: string;
}

// CPU budget per test case; the drivers enforce it themselves in multi mode.
const CASE_CPU_TIMEOUT_MS = 5000;
// Judge0 1.13.1 ceilings: MAX_CPU_TIME_LIMIT (judge0.conf) and the default
// MAX_WALL_TIME_LIMIT. Requests above them are rejected.
const MAX_CPU_TIME_LIMIT_S = 15;
const MAX_WALL_TIME_LIMIT_S = 20;

/**
 * Executes a question's test cases against Judge0 and returns one result per
 * test case, in order, in the same shape as a per-test-case Judge0 result.
 *
 * Function-style Java/Python solutions (the generated drivers) run every test
 * case in ONE execution: one compile and one sandbox per Run/Submit instead
 * of one per test case. Anything else (own main(), other languages) runs one
 * execution per test case, as one Judge0 batch.
 *
 * Trade-offs of the single execution: memory is measured for the whole
 * execution, and Judge0's CPU ceiling (15 s) is shared by all test cases. The
 * drivers stop a case after 5 s of CPU and mark the remaining cases as skipped.
 */
@Injectable()
export class TestCaseRunnerService {
  constructor(
    private readonly judgeService: JudgeService,
    private readonly codeHarness: CodeHarnessService,
  ) {}

  async run(
    code: string,
    language: string | number,
    cases: TestCaseSpec[],
    options: JudgeBatchOptions = {},
  ): Promise<JudgeBatchItemResult[]> {
    if (cases.length === 0) return [];

    const program = this.codeHarness.prepare(code, language);

    if (program.stdinMode !== "json") {
      return this.judgeService.submitBatch(
        cases.map((testCase) => ({
          sourceCode: program.sourceCode,
          language,
          stdin: this.codeHarness.buildStdin(testCase.input, program.stdinMode),
          expectedOutput: testCase.expectedOutput,
        })),
        options,
      );
    }

    const nonce = `@@IV${randomBytes(12).toString("hex")}@@`;
    const cpuTimeLimit = Math.min(
      MAX_CPU_TIME_LIMIT_S,
      (CASE_CPU_TIMEOUT_MS / 1000) * cases.length + 1,
    );
    const [execution] = await this.judgeService.submitBatch(
      [
        {
          sourceCode: program.sourceCode,
          language,
          stdin: this.codeHarness.buildMultiCaseStdin(
            cases.map((testCase) => testCase.input),
            nonce,
            CASE_CPU_TIMEOUT_MS,
          ),
          cpuTimeLimit,
          wallTimeLimit: Math.min(MAX_WALL_TIME_LIMIT_S, cpuTimeLimit + 5),
        },
      ],
      options,
    );

    return this.splitExecution(execution, nonce, cases.length);
  }

  private splitExecution(
    execution: JudgeBatchItemResult | undefined,
    nonce: string,
    count: number,
  ): JudgeBatchItemResult[] {
    const whole = execution?.result;
    if (!whole) {
      const error = execution?.error || "Judge0 execution engine error";
      return Array.from({ length: count }, () => ({ result: null, error }));
    }

    // Compilation errors apply to every test case alike.
    if (whole.statusId === 6) {
      return Array.from({ length: count }, () => ({ result: whole, error: null }));
    }

    return this.codeHarness
      .parseMultiCaseOutput(whole.stdout, nonce, count)
      .map((caseOutput) => ({
        result: caseOutput ? this.caseResult(whole, caseOutput) : this.unreportedCaseResult(whole),
        error: null,
      }));
  }

  private caseResult(whole: NormalizedJudgeResult, caseOutput: MultiCaseOutput): NormalizedJudgeResult {
    const base = {
      token: whole.token,
      stdout: caseOutput.output,
      stderr: "",
      compileOutput: "",
      message: "",
      time: caseOutput.timeMs / 1000,
      memory: whole.memory,
    };
    switch (caseOutput.status) {
      case "ok":
        return { ...base, statusId: 3, statusDescription: "Accepted", error: null };
      case "tle":
        return { ...base, statusId: 5, statusDescription: "Time Limit Exceeded", error: "Time Limit Exceeded" };
      case "skipped":
        return {
          ...base,
          time: null,
          statusId: 5,
          statusDescription: "Time Limit Exceeded",
          error: "Not run: an earlier test case exceeded the time limit",
        };
      case "mle":
        return { ...base, statusId: 12, statusDescription: "Memory Limit Exceeded", error: "Memory Limit Exceeded" };
      default:
        return {
          ...base,
          stdout: caseOutput.printed,
          stderr: caseOutput.error,
          statusId: 11,
          statusDescription: "Runtime Error (NZEC)",
          error: caseOutput.error || "Runtime Error",
        };
    }
  }

  // The execution ended before this test case reported a result.
  private unreportedCaseResult(whole: NormalizedJudgeResult): NormalizedJudgeResult {
    if (whole.statusId === 5) {
      return { ...whole, stdout: "", error: "Time Limit Exceeded" };
    }
    if (whole.statusId === 3 || whole.statusId === 4) {
      return {
        ...whole,
        stdout: "",
        statusId: 11,
        statusDescription: "Runtime Error (NZEC)",
        error: whole.stderr || "The program exited before this test case finished.",
      };
    }
    return {
      ...whole,
      stdout: "",
      error: whole.error || whole.stderr || whole.message || whole.statusDescription,
    };
  }
}
