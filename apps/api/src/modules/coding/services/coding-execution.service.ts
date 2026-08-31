import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { JudgeService } from "./judge.service";
import { OracleRegistry } from "../oracles/oracle.registry";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { UserRole } from "@prisma/client";
import {
  RunCodeDto,
  RunCodeResponseDto,
  PublicTestResultDto,
  PublicTestStatus,
} from "../dto/run-code.dto";
import { SubmissionEvaluatorService } from "./submission-evaluator.service";
import { SubmitCodeDto, SubmitCodeResponseDto } from "../dto/submit-code.dto";
import { AppLogger } from "@intervu-ai/shared-logger";
import { CodingContextResolverService } from "./coding-context-resolver.service";

@Injectable()
export class CodingExecutionService {
  private readonly logger = new AppLogger({ name: "CodingExecutionService" });
  private readonly activeLocks = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly judgeService: JudgeService,
    private readonly oracleRegistry: OracleRegistry,
    private readonly evaluatorService: SubmissionEvaluatorService,
    private readonly contextResolver: CodingContextResolverService,
  ) {}

  private acquireLock(lockKey: string): void {
    if (this.activeLocks.has(lockKey)) {
      throw new BadRequestException(
        "A code execution or evaluation is already in progress for this question. Please wait for it to complete.",
      );
    }
    this.activeLocks.add(lockKey);
  }

  private releaseLock(lockKey: string): void {
    this.activeLocks.delete(lockKey);
  }



  /**
   * Executes public tests for a candidate coding submission.
   */
  async runPublicTests(
    dto: RunCodeDto,
    user: AuthUser,
  ): Promise<RunCodeResponseDto> {
    const lockKey = `run:${dto.testInstanceId || user.id}:${dto.questionId}`;
    this.acquireLock(lockKey);

    try {
      // 1. Resolve context using single source of truth
      const { codingData } = await this.contextResolver.resolveContext(
        dto.questionId,
        dto.testInstanceId,
        user,
      );

      // 2. Resolve Oracle if available for fallback expected output calculation
      let oracleKey = codingData?.oracleKey;
      
      let rawPublicTests = Array.isArray(codingData?.publicTests)
        ? codingData.publicTests
        : [];

    // 4. Resolve Oracle if available for fallback expected output calculation
    const oracle = oracleKey && this.oracleRegistry.hasOracle(oracleKey)
      ? this.oracleRegistry.getOracle(oracleKey)
      : null;

    // 5. Code Sanitization for Language Execution Engine Compatibility (e.g. Java class name, Python driver)
    let sourceCodeToSubmit = dto.code;
    const langLower = String(dto.language).toLowerCase();
    const isJava = langLower.includes("java") || langLower === "62";
    const isPython = langLower.includes("python") || langLower === "71" || langLower === "py";

    if (isJava) {
      // Replace "public class Solution" with "public class Main" so Judge0 javac compiles Main.java without error
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

    const results: PublicTestResultDto[] = [];
    let passedCount = 0;

    // 6. Execute each public test case
    for (let i = 0; i < rawPublicTests.length; i++) {
      const testCase = rawPublicTests[i];
      const testInput = testCase.input;

      // Determine expected output
      let expectedOutput = testCase.expectedOutput;
      if (
        (expectedOutput === undefined || expectedOutput === null) &&
        oracle
      ) {
        try {
          expectedOutput = oracle.generateExpectedOutput(testInput);
        } catch (oracleErr) {
          this.logger.warn("Oracle expected output generation error", {
            oracleKey,
            testInput,
            oracleErr,
          });
        }
      }

      // Format stdin string
      const stdinString = this.formatStdin(testInput);
      const expectedOutputString = this.formatExpectedOutput(expectedOutput);

      // Submit to Judge0
      let judgeResult;
      try {
        judgeResult = await this.judgeService.submitAndPoll({
          sourceCode: sourceCodeToSubmit,
          language: dto.language,
          stdin: stdinString,
          expectedOutput: expectedOutputString,
        });
      } catch (err: any) {
        this.logger.error("Judge0 execution failure during public test run", {
          questionId: dto.questionId,
          testIndex: i + 1,
          error: err?.message || String(err),
        });

        results.push({
          testIndex: i + 1,
          status: "ERROR",
          input: testInput,
          expectedOutput: expectedOutput,
          actualOutput: null,
          runtimeSeconds: null,
          memoryKb: null,
          error: err?.message || "Judge0 execution engine error",
        });
        continue;
      }

      // Output Comparison & Status Mapping
      let status: PublicTestStatus = "FAILED";
      let actualOutput = judgeResult.stdout || "";
      let resError = judgeResult.error;

      const isVmOrInfrastructureError = Boolean(
        resError &&
          (resError.includes("Could not allocate metaspace") ||
           resError.includes("Error occurred during initialization of VM") ||
           resError.includes("OutOfMemoryError") ||
           resError.includes("Cannot allocate memory"))
      );

      if (judgeResult.statusId === 6 && !isVmOrInfrastructureError) {
        status = "COMPILATION_ERROR";
      } else if (judgeResult.statusId === 5) {
        status = "TIME_LIMIT_EXCEEDED";
      } else if (judgeResult.statusId > 6 || isVmOrInfrastructureError) {
        status = "ERROR";
      } else if (judgeResult.statusId === 3 || judgeResult.statusId === 4) {
        // Judge0 status 3 is Accepted, status 4 is Wrong Answer
        const isMatch = this.compareOutputs(actualOutput, expectedOutput);
        if (isMatch) {
          status = "PASSED";
          passedCount++;
          resError = null;
        } else {
          status = "FAILED";
          if (!resError) resError = "Wrong Answer";
        }
      }

      results.push({
        testIndex: i + 1,
        status,
        input: testInput,
        expectedOutput: expectedOutput,
        actualOutput: actualOutput,
        runtimeSeconds: judgeResult.time,
        memoryKb: judgeResult.memory,
        error: status === "PASSED" ? null : resError,
      });
    }

      return {
        success: true,
        questionId: dto.questionId,
        summary: {
          total: results.length,
          passed: passedCount,
          failed: results.length - passedCount,
        },
        results,
      };
    } finally {
      this.releaseLock(lockKey);
    }
  }

  private convertObjectToStdin(input: any): string {
    if (input === null || input === undefined) return "";
    if (typeof input === "string") return input.trim();
    if (typeof input === "number" || typeof input === "boolean") return String(input);

    if (Array.isArray(input)) {
      if (input.length === 0) return "0";
      if (typeof input[0] === "object" && input[0] !== null) {
        const lines: string[] = [String(input.length)];
        for (const item of input) {
          lines.push(Object.values(item).join(" "));
        }
        return lines.join("\n");
      }
      return input.join(" ");
    }

    if (typeof input === "object") {
      if (typeof input.stdin === "string") {
        return input.stdin.trim();
      }

      const lines: string[] = [];
      for (const key of Object.keys(input)) {
        const val = input[key];
        if (val === null || val === undefined) continue;

        if (Array.isArray(val)) {
          if (val.length === 0) {
            lines.push("0");
          } else if (typeof val[0] === "object" && val[0] !== null) {
            lines.push(String(val.length));
            for (const item of val) {
              lines.push(Object.values(item).join(" "));
            }
          } else {
            lines.push(val.join(" "));
          }
        } else if (typeof val === "object") {
          lines.push(Object.values(val).join(" "));
        } else {
          lines.push(String(val));
        }
      }
      return lines.join("\n");
    }

    return String(input).trim();
  }

  private formatStdin(input: any): string {
    if (input === null || input === undefined) return "";
    if (typeof input === "string") {
      const trimmed = input.trim();
      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        try {
          const parsed = JSON.parse(trimmed);
          return this.convertObjectToStdin(parsed);
        } catch {
          return trimmed;
        }
      }
      return trimmed;
    }
    if (typeof input === "number" || typeof input === "boolean") return String(input);
    if (typeof input === "object") {
      return this.convertObjectToStdin(input);
    }
    return String(input).trim();
  }

  private formatExpectedOutput(expected: any): string {
    if (expected === null || expected === undefined) return "";
    if (typeof expected === "string") {
      const trimmed = expected.trim();
      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        try {
          const parsed = JSON.parse(trimmed);
          return this.formatExpectedOutput(parsed);
        } catch {
          return trimmed;
        }
      }
      return trimmed;
    }
    if (typeof expected === "boolean" || typeof expected === "number") return String(expected);
    if (typeof expected === "object" && expected !== null) {
      const keys = Object.keys(expected);
      if (keys.length === 1) {
        return this.formatExpectedOutput(expected[keys[0]]);
      }
      if ("result" in expected) return this.formatExpectedOutput(expected.result);
      if ("indices" in expected) return this.formatExpectedOutput(expected.indices);
      if ("index" in expected) return this.formatExpectedOutput(expected.index);
      if ("ans" in expected) return this.formatExpectedOutput(expected.ans);
      if ("answer" in expected) return this.formatExpectedOutput(expected.answer);
      if ("output" in expected) return this.formatExpectedOutput(expected.output);
      if (Array.isArray(expected)) {
        return expected.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(" ");
      }
      return Object.values(expected).join(" ");
    }
    return String(expected);
  }

  /**
   * Compares actual output string against expected output object/primitive.
   */
  private compareOutputs(actualRaw: string, expectedObj: any): boolean {
    if (expectedObj === null || expectedObj === undefined) {
      return true;
    }

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

  /**
   * Performs Phase 5 full coding submission & evaluation across Public, Hidden, Boundary, and Stress test suites.
   */
  async submitFullEvaluation(
    dto: SubmitCodeDto,
    user: AuthUser,
  ): Promise<SubmitCodeResponseDto> {
    const lockKey = `submit:${dto.testInstanceId || user.id}:${dto.questionId}`;
    this.acquireLock(lockKey);

    try {
      // 1. Resolve context using single source of truth (ownership is verified inside resolver)
      const { codingData, questionText } = await this.contextResolver.resolveContext(
        dto.questionId,
        dto.testInstanceId,
        user,
      );

      const isDemoSession =
        !dto.testInstanceId ||
        dto.testInstanceId.startsWith("demo") ||
        dto.testInstanceId.includes("sandbox") ||
        dto.testInstanceId.includes("sample");

      // 4. Perform full server-side evaluation via SubmissionEvaluatorService
      const evalResult = await this.evaluatorService.evaluateSubmission(
        dto,
        codingData,
        questionText,
        isDemoSession,
      );

      // 5. Create unique submission ID & persist submission in CandidateAnswer / Submission if DB is available
      const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (dto.testInstanceId && this.prisma?.candidateAnswer) {
        try {
          await this.prisma.candidateAnswer.upsert({
            where: {
              testInstanceId_questionId: {
                testInstanceId: dto.testInstanceId,
                questionId: dto.questionId,
              },
            },
            create: {
              testInstanceId: dto.testInstanceId,
              questionId: dto.questionId,
              answer: {
                code: dto.code,
                language: dto.language,
                submissionId,
                score: evalResult.score,
                verdict: evalResult.verdict,
                submittedAt: new Date().toISOString(),
              },
            },
            update: {
              answer: {
                code: dto.code,
                language: dto.language,
                submissionId,
                score: evalResult.score,
                verdict: evalResult.verdict,
                submittedAt: new Date().toISOString(),
              },
            },
          });
        } catch (dbErr: any) {
          this.logger.warn("CandidateAnswer persistence non-fatal warning", {
            error: dbErr?.message || String(dbErr),
          });
        }
      }

      // 6. Return Candidate-Safe Final Result (NO private test inputs or expected outputs)
      return {
        success: true,
        submissionId,
        status: "COMPLETED",
        verdict: evalResult.verdict,
        score: evalResult.score,
        summary: {
          total: evalResult.totalTests,
          passed: evalResult.passedTests,
          failed: evalResult.failedTests,
          categories: evalResult.categories,
        },
        executionTime: evalResult.executionTime,
        memory: evalResult.memory,
        errorMessage: evalResult.errorMessage || null,
      };
    } finally {
      this.releaseLock(lockKey);
    }
  }
}
