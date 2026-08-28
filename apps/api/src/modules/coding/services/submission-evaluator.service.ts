import { Injectable, Logger } from "@nestjs/common";
import { JudgeService } from "./judge.service";
import { OracleRegistry } from "../oracles/oracle.registry";
import {
  SubmitCodeDto,
  SubmitCodeResponseDto,
  CodingVerdict,
  CategorySummary,
} from "../dto/submit-code.dto";

export interface InternalTestCase {
  category: "public" | "hidden" | "boundary" | "stress";
  input: any;
  expectedOutput?: any;
}

export interface InternalTestExecutionResult {
  category: "public" | "hidden" | "boundary" | "stress";
  status: "PASSED" | "FAILED" | "COMPILATION_ERROR" | "TIME_LIMIT_EXCEEDED" | "RUNTIME_ERROR" | "MEMORY_LIMIT_EXCEEDED";
  runtimeSeconds: number;
  memoryKb: number;
  error?: string | null;
}

@Injectable()
export class SubmissionEvaluatorService {
  private readonly logger = new Logger(SubmissionEvaluatorService.name);

  constructor(
    private readonly judgeService: JudgeService,
    private readonly oracleRegistry: OracleRegistry,
  ) {}

  /**
   * Performs full server-side evaluation across Public, Hidden, Boundary, and Stress test suites.
   */
  async evaluateSubmission(
    dto: SubmitCodeDto,
    codingData: any,
    questionText: string,
    isDemoSession: boolean = false,
  ): Promise<{
    verdict: CodingVerdict;
    score: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    executionTime: number;
    memory: number;
    categories: {
      public: CategorySummary;
      hidden: CategorySummary;
      boundary: CategorySummary;
      stress: CategorySummary;
    };
    results: InternalTestExecutionResult[];
    errorMessage?: string;
  }> {
    // 1. Resolve Oracle & question topic
    const oracleKey = codingData?.oracleKey;
    const oracle = oracleKey && this.oracleRegistry.hasOracle(oracleKey)
      ? this.oracleRegistry.getOracle(oracleKey)
      : null;

    // 2. Assemble test cases across categories (Public, Hidden, Boundary, Stress)
    const testCases: InternalTestCase[] = [];

    // Public tests
    const rawPublic = Array.isArray(codingData?.publicTests) && codingData.publicTests.length > 0
      ? codingData.publicTests
      : [];

    for (const t of rawPublic) {
      testCases.push({ category: "public", input: t.input, expectedOutput: t.expectedOutput });
    }

    // Hidden tests
    const rawHidden = Array.isArray(codingData?.hiddenTests) && codingData.hiddenTests.length > 0
      ? codingData.hiddenTests
      : [];

    for (const t of rawHidden) {
      testCases.push({ category: "hidden", input: t.input, expectedOutput: t.expectedOutput });
    }

    // Boundary tests
    const rawBoundary = Array.isArray(codingData?.boundaryTests) && codingData.boundaryTests.length > 0
      ? codingData.boundaryTests
      : [];

    for (const t of rawBoundary) {
      testCases.push({ category: "boundary", input: t.input, expectedOutput: t.expectedOutput });
    }

    // Stress tests
    const rawStress = Array.isArray(codingData?.stressTests) && codingData.stressTests.length > 0
      ? codingData.stressTests
      : [];

    for (const t of rawStress) {
      testCases.push({ category: "stress", input: t.input, expectedOutput: t.expectedOutput });
    }

    // 3. Prepare Code for Execution
    let sourceCodeToSubmit = dto.code;
    const langLower = String(dto.language).toLowerCase();
    const isJava = langLower.includes("java") || langLower === "62";
    const isPython = langLower.includes("python") || langLower === "71" || langLower === "py";

    if (isJava) {
      sourceCodeToSubmit = sourceCodeToSubmit.replace(
        /public\s+class\s+([A-Za-z0-9_]+)/g,
        (match, className) => (className !== "Main" ? "public class Main" : match),
      );
    } else if (isPython) {
      if (!sourceCodeToSubmit.includes("__future__")) {
        sourceCodeToSubmit = "from __future__ import annotations\n" + sourceCodeToSubmit;
      }
      const hasMain = sourceCodeToSubmit.includes("__main__") || sourceCodeToSubmit.includes("sys.stdin");
      if (!hasMain) {
        let funcName = "solution";
        const match = sourceCodeToSubmit.match(/def\s+([A-Za-z0-9_]+)\s*\(/);
        if (match && match[1]) {
          funcName = match[1];
        }

        sourceCodeToSubmit += `\n\nif __name__ == '__main__':
    import sys, json
    _raw = sys.stdin.read().strip()
    if _raw:
        try:
            _val = json.loads(_raw)
        except Exception:
            _val = int(_raw) if _raw.lstrip('-').isdigit() else _raw
        
        _res = None
        if isinstance(_val, dict):
            try:
                _res = ${funcName}(**_val)
            except TypeError:
                try:
                    _res = ${funcName}(_val)
                except Exception:
                    _res = ${funcName}(*list(_val.values()))
        elif isinstance(_val, (list, tuple)):
            try:
                _res = ${funcName}(*_val)
            except TypeError:
                _res = ${funcName}(_val)
        else:
            _res = ${funcName}(_val)

        if isinstance(_res, bool):
            print(str(_res).lower())
        elif isinstance(_res, (dict, list)):
            print(json.dumps(_res))
        elif _res is not None:
            print(_res)
`;
      }
    }

    // Category counters
    const categoryStats = {
      public: { total: 0, passed: 0, failed: 0 },
      hidden: { total: 0, passed: 0, failed: 0 },
      boundary: { total: 0, passed: 0, failed: 0 },
      stress: { total: 0, passed: 0, failed: 0 },
    };

    const results: InternalTestExecutionResult[] = [];
    let passedCount = 0;
    let totalRuntime = 0;
    let maxMemory = 0;
    let globalCompilationError = false;
    let globalTimeLimitError = false;
    let globalMemoryLimitError = false;
    let globalRuntimeError = false;
    let firstErrorMessage: string | undefined;

    // 4. Execute test suite against Judge0
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      categoryStats[tc.category].total++;

      // Compute expected output via Oracle if not explicitly provided
      let expectedOutput = tc.expectedOutput;
      if ((expectedOutput === undefined || expectedOutput === null) && oracle) {
        try {
          expectedOutput = oracle.generateExpectedOutput(tc.input);
        } catch (oracleErr) {
          this.logger.warn(`Oracle expected output error for ${oracleKey}`, oracleErr);
        }
      }

      const stdinString = this.formatStdin(tc.input);
      const expectedOutputString = this.formatExpectedOutput(expectedOutput);

      let judgeResult: any;
      try {
        judgeResult = await this.judgeService.submitAndPoll({
          sourceCode: sourceCodeToSubmit,
          language: dto.language,
          stdin: stdinString,
          expectedOutput: expectedOutputString,
        });
      } catch (err: any) {
        this.logger.error(`Judge0 execution failure on ${tc.category} test #${i + 1}`, err?.message || err);
        results.push({
          category: tc.category,
          status: "RUNTIME_ERROR",
          runtimeSeconds: 0,
          memoryKb: 0,
          error: err?.message || "Execution engine failure",
        });
        categoryStats[tc.category].failed++;
        globalRuntimeError = true;
        if (!firstErrorMessage) firstErrorMessage = err?.message || "Execution engine failure";
        continue;
      }

      const actualOutput = judgeResult.stdout || "";
      const runtime = judgeResult.time || 0;
      const memory = judgeResult.memory || 0;
      totalRuntime += runtime;
      if (memory > maxMemory) maxMemory = memory;

      let status: "PASSED" | "FAILED" | "COMPILATION_ERROR" | "TIME_LIMIT_EXCEEDED" | "RUNTIME_ERROR" | "MEMORY_LIMIT_EXCEEDED" = "FAILED";

      const isVmOrInfrastructureError = Boolean(
        judgeResult.error &&
          (judgeResult.error.includes("Could not allocate metaspace") ||
           judgeResult.error.includes("Error occurred during initialization of VM") ||
           judgeResult.error.includes("OutOfMemoryError") ||
           judgeResult.error.includes("Cannot allocate memory"))
      );

      if (judgeResult.statusId === 6 && !isVmOrInfrastructureError) {
        status = "COMPILATION_ERROR";
        globalCompilationError = true;
        categoryStats[tc.category].failed++;
        if (!firstErrorMessage) firstErrorMessage = judgeResult.error || "Compilation Error";
      } else if (judgeResult.statusId === 5) {
        status = "TIME_LIMIT_EXCEEDED";
        globalTimeLimitError = true;
        categoryStats[tc.category].failed++;
        if (!firstErrorMessage) firstErrorMessage = "Time Limit Exceeded";
      } else if (judgeResult.statusId === 12) {
        status = "MEMORY_LIMIT_EXCEEDED";
        globalMemoryLimitError = true;
        categoryStats[tc.category].failed++;
        if (!firstErrorMessage) firstErrorMessage = "Memory Limit Exceeded";
      } else if (judgeResult.statusId > 6 || isVmOrInfrastructureError) {
        status = "RUNTIME_ERROR";
        globalRuntimeError = true;
        categoryStats[tc.category].failed++;
        if (!firstErrorMessage) firstErrorMessage = judgeResult.error || "Runtime / Execution Error";
      } else if (judgeResult.statusId === 3 || judgeResult.statusId === 4) {
        const isMatch = this.compareOutputs(actualOutput, expectedOutput);
        if (isMatch) {
          status = "PASSED";
          passedCount++;
          categoryStats[tc.category].passed++;
        } else {
          status = "FAILED";
          categoryStats[tc.category].failed++;
        }
      } else {
        categoryStats[tc.category].failed++;
      }

      results.push({
        category: tc.category,
        status,
        runtimeSeconds: runtime,
        memoryKb: memory,
        error: status !== "PASSED" ? judgeResult.error || null : null,
      });
    }

    // 5. Determine Overall Final Verdict
    let verdict: CodingVerdict = "ACCEPTED";
    if (globalCompilationError) {
      verdict = "COMPILE_ERROR";
    } else if (globalTimeLimitError) {
      verdict = "TIME_LIMIT_EXCEEDED";
    } else if (globalMemoryLimitError) {
      verdict = "MEMORY_LIMIT_EXCEEDED";
    } else if (globalRuntimeError) {
      verdict = "RUNTIME_ERROR";
    } else if (passedCount < testCases.length) {
      verdict = "WRONG_ANSWER";
    } else {
      verdict = "ACCEPTED";
    }

    // 6. Score Calculation (Deterministic 0 - 100%)
    const score = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 0;

    return {
      verdict,
      score,
      totalTests: testCases.length,
      passedTests: passedCount,
      failedTests: testCases.length - passedCount,
      executionTime: Math.round(totalRuntime * 1000) / 1000,
      memory: maxMemory,
      categories: categoryStats,
      results,
      errorMessage: firstErrorMessage,
    };
  }

  private formatStdin(input: any): string {
    if (input === null || input === undefined) return "";
    if (typeof input === "string") return input.trim();
    if (typeof input === "number" || typeof input === "boolean") return String(input);
    if (typeof input === "object") {
      if (typeof input.stdin === "string") return input.stdin.trim();
      return JSON.stringify(input);
    }
    return JSON.stringify(input);
  }

  private formatExpectedOutput(expected: any): string {
    if (expected === null || expected === undefined) return "";
    if (typeof expected === "string") return expected.trim();
    if (typeof expected === "boolean" || typeof expected === "number") return String(expected);
    if (typeof expected === "object" && expected !== null && "result" in expected) {
      return typeof expected.result === "string" ? expected.result.trim() : String(expected.result);
    }
    return JSON.stringify(expected);
  }

  private compareOutputs(actualRaw: string, expectedObj: any): boolean {
    if (expectedObj === null || expectedObj === undefined) return true;

    const actualTrimmed = (actualRaw || "").replace(/\r\n/g, "\n").trim();
    if (actualTrimmed === "") {
      return expectedObj === "" || expectedObj === null || expectedObj === undefined;
    }

    // Helper to unwrap single-key result wrappers if present (e.g. { result: ... }, { indices: ... }, { index: ... }, { count: ... })
    const unwrap = (val: any): any => {
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        const keys = Object.keys(val);
        if (keys.length === 1) {
          return val[keys[0]];
        }
        if ("result" in val) return val.result;
        if ("indices" in val) return val.indices;
        if ("index" in val) return val.index;
        if ("count" in val) return val.count;
        if ("ans" in val) return val.ans;
        if ("answer" in val) return val.answer;
        if ("finalBalance" in val) return val.finalBalance;
        if ("averageWaitingTime" in val) return val.averageWaitingTime;
      }
      return val;
    };

    const expectedTarget = unwrap(expectedObj);

    // 1. Direct match against raw primitive string representations
    if (typeof expectedTarget === "boolean") {
      if (actualTrimmed.toLowerCase() === String(expectedTarget).toLowerCase()) {
        return true;
      }
    }

    if (typeof expectedTarget === "number") {
      if (actualTrimmed === String(expectedTarget)) {
        return true;
      }
    }

    if (typeof expectedTarget === "string") {
      if (actualTrimmed.toLowerCase() === expectedTarget.replace(/\r\n/g, "\n").trim().toLowerCase()) {
        return true;
      }
    }

    // 2. Direct JSON string match
    try {
      if (actualTrimmed === JSON.stringify(expectedObj) || actualTrimmed === JSON.stringify(expectedTarget)) {
        return true;
      }
    } catch {}

    // 3. Try parsing actualRaw as JSON for deep or unwrapped equality
    try {
      const parsedActual = JSON.parse(actualTrimmed);
      const actualTarget = unwrap(parsedActual);

      // Compare boolean
      if (typeof expectedTarget === "boolean" || typeof actualTarget === "boolean") {
        if (String(actualTarget).toLowerCase() === String(expectedTarget).toLowerCase()) {
          return true;
        }
      }

      // Compare number
      if (typeof expectedTarget === "number" || typeof actualTarget === "number") {
        if (Number(actualTarget) === Number(expectedTarget)) {
          return true;
        }
      }

      // Compare string
      if (typeof expectedTarget === "string" || typeof actualTarget === "string") {
        if (String(actualTarget).trim().toLowerCase() === String(expectedTarget).trim().toLowerCase()) {
          return true;
        }
      }

      // Deep compare objects/arrays via stable JSON
      if (JSON.stringify(actualTarget) === JSON.stringify(expectedTarget)) {
        return true;
      }
      if (JSON.stringify(parsedActual) === JSON.stringify(expectedObj)) {
        return true;
      }
    } catch {
      // If not valid JSON, check boolean 1/0 or true/false fallback
      if (typeof expectedTarget === "boolean") {
        if (expectedTarget === true && (actualTrimmed.toLowerCase() === "true" || actualTrimmed === "1")) return true;
        if (expectedTarget === false && (actualTrimmed.toLowerCase() === "false" || actualTrimmed === "0")) return true;
      }
    }

    return false;
  }
}
