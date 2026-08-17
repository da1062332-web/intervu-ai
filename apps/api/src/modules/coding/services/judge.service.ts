import { Injectable, BadRequestException, GatewayTimeoutException, InternalServerErrorException } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";

export interface NormalizedJudgeResult {
  token: string;
  statusId: number;
  statusDescription: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  time: number | null; // runtime in seconds
  memory: number | null; // memory in KB
  error: string | null; // normalized error message
}

export interface JudgeSubmissionOptions {
  sourceCode: string;
  language: string | number;
  stdin?: string;
  expectedOutput?: string;
  cpuTimeLimit?: number; // seconds
  memoryLimit?: number; // KB
  compilerOptions?: string;
}

const LANGUAGE_MAP: Record<string, number> = {
  python: 71,
  py: 71,
  python3: 71,
  "python-3": 71,
  java: 62,
  openjdk: 62,
  cpp: 54,
  "c++": 54,
  c_cpp: 54,
  c: 50,
  javascript: 63,
  js: 63,
  node: 63,
  nodejs: 63,
  typescript: 74,
  ts: 74,
  go: 60,
  golang: 60,
  rust: 73,
  rs: 73,
  csharp: 51,
  cs: 51,
  "c#": 51,
};

@Injectable()
export class JudgeService {
  private readonly logger = new AppLogger({ name: "JudgeService" });

  getJudge0Url(): string {
    const url = process.env.JUDGE0_URL || "http://localhost:2358";
    return url.replace(/\/$/, "");
  }

  getJudge0Headers(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      "User-Agent": "intervu-ai",
    };
    const apiKey = process.env.JUDGE0_API_KEY || process.env.RAPIDAPI_KEY;
    const apiHost = process.env.JUDGE0_API_HOST || process.env.RAPIDAPI_HOST;
    const authToken = process.env.JUDGE0_AUTH_TOKEN;

    if (apiKey) {
      headers["X-RapidAPI-Key"] = apiKey;
      headers["X-Auth-Key"] = apiKey;
    }
    if (apiHost) {
      headers["X-RapidAPI-Host"] = apiHost;
    }
    if (authToken) {
      headers["X-Auth-Token"] = authToken;
    }
    return headers;
  }

  mapLanguageToId(language: string | number): number {
    if (typeof language === "number") {
      return language;
    }
    const parsed = parseInt(language, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
    const cleanLang = String(language).trim().toLowerCase();
    const mapped = LANGUAGE_MAP[cleanLang];
    if (!mapped) {
      throw new BadRequestException(
        `Unsupported programming language: "${language}". Supported languages include Python, Java, C++, JavaScript, TypeScript, Go, Rust, and C#.`,
      );
    }
    return mapped;
  }

  private encodeBase64(str: string | null | undefined): string {
    if (!str) return "";
    return Buffer.from(str, "utf-8").toString("base64");
  }

  private decodeBase64(b64: string | null | undefined): string {
    if (!b64) return "";
    try {
      return Buffer.from(b64, "base64").toString("utf-8");
    } catch {
      return b64;
    }
  }

  async submitAndPoll(
    options: JudgeSubmissionOptions,
  ): Promise<NormalizedJudgeResult> {
    const judge0Url = this.getJudge0Url();
    const languageId = this.mapLanguageToId(options.language);

    // For Java (62), pass compiler/VM flags to cap CompressedClassSpace and Metaspace
    // to prevent VM startup crash: "Could not allocate metaspace: 1073741824 bytes"
    let compilerOptions = options.compilerOptions;
    if (languageId === 62 && !compilerOptions) {
      compilerOptions = "-J-XX:CompressedClassSpaceSize=64m -J-XX:MaxMetaspaceSize=128m -J-Xmx256m";
    }

    const payload = {
      source_code: this.encodeBase64(options.sourceCode),
      language_id: languageId,
      stdin: this.encodeBase64(options.stdin || ""),
      expected_output: options.expectedOutput
        ? this.encodeBase64(options.expectedOutput)
        : undefined,
      cpu_time_limit: options.cpuTimeLimit ?? 5,
      memory_limit: options.memoryLimit ?? 2048000,
      compiler_options: compilerOptions,
      run_options: languageId === 62 ? "-XX:CompressedClassSpaceSize=64m -XX:MaxMetaspaceSize=128m -Xmx256m" : undefined,
    };

    let responseData: any;
    let attempt = 0;
    const maxAttempts = 3;
    let lastError: any;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const res = await fetch(
          `${judge0Url}/submissions?base64_encoded=true&wait=true`,
          {
            method: "POST",
            headers: this.getJudge0Headers(),
            body: JSON.stringify(payload),
          },
        );

        if (!res.ok) {
          const errText = await res.text();
          this.logger.warn(`Judge0 submission HTTP error (Attempt ${attempt}/${maxAttempts})`, {
            status: res.status,
            response: errText,
          });
          if (attempt >= maxAttempts) {
            throw new InternalServerErrorException(
              `Judge0 execution service returned error: ${res.statusText} (${res.status})`,
            );
          }
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
          continue;
        }

        responseData = await res.json();
        break;
      } catch (err: any) {
        lastError = err;
        if (err instanceof InternalServerErrorException || err instanceof BadRequestException) {
          throw err;
        }
        this.logger.warn(`Judge0 connection attempt ${attempt}/${maxAttempts} failed`, {
          url: judge0Url,
          error: err?.message || String(err),
        });
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        }
      }
    }

    if (!responseData) {
      this.logger.error("All Judge0 connection attempts failed", {
        url: judge0Url,
        error: lastError?.message || String(lastError),
      });
      throw new InternalServerErrorException(
        `Unable to connect to Judge0 execution service at ${judge0Url} after ${maxAttempts} attempts. Please ensure Judge0 is running.`,
      );
    }

    let statusId = responseData?.status?.id ?? 1;
    const token = responseData?.token || "";

    // Poll if submission is in queue (1) or processing (2)
    let pollCount = 0;
    const maxPolls = 10;
    const pollDelayMs = process.env.NODE_ENV === "test" ? 10 : 500;
    while ((statusId === 1 || statusId === 2) && pollCount < maxPolls) {
      await new Promise((resolve) => setTimeout(resolve, pollDelayMs));
      pollCount++;

      try {
        const pollRes = await fetch(
          `${judge0Url}/submissions/${token}?base64_encoded=true`,
          {
            headers: this.getJudge0Headers(),
          },
        );
        if (pollRes.ok) {
          responseData = await pollRes.json();
          statusId = responseData?.status?.id ?? statusId;
        }
      } catch (pollErr) {
        this.logger.warn("Polling Judge0 status error", { token, pollErr });
      }
    }

    if (statusId === 1 || statusId === 2) {
      throw new GatewayTimeoutException(
        "Code execution timed out while waiting for Judge0 worker evaluation.",
      );
    }

    const normalized = this.normalizeResult(token, responseData);
    // Auto-clean submission artifacts from Judge0 memory/storage
    this.deleteSubmission(token).catch(() => null);
    return normalized;
  }

  async deleteSubmission(token: string): Promise<void> {
    if (!token) return;
    try {
      await fetch(`${this.getJudge0Url()}/submissions/${token}`, {
        method: "DELETE",
        headers: this.getJudge0Headers(),
      });
    } catch {
      // Ignore background cleanup failure
    }
  }

  private normalizeResult(token: string, rawData: any): NormalizedJudgeResult {
    let statusId = rawData?.status?.id ?? 3;
    let statusDescription = rawData?.status?.description ?? "Accepted";

    const stdout = this.decodeBase64(rawData?.stdout);
    const stderr = this.decodeBase64(rawData?.stderr);
    const compileOutput = this.decodeBase64(rawData?.compile_output);
    const message = this.decodeBase64(rawData?.message);

    const time = rawData?.time !== null && rawData?.time !== undefined ? parseFloat(rawData.time) : null;
    const memory = rawData?.memory !== null && rawData?.memory !== undefined ? parseInt(rawData.memory, 10) : null;

    let error: string | null = null;
    if (statusId > 3) {
      error = compileOutput || stderr || message || statusDescription;
    }

    // Reclassify VM initialization or infrastructure resource failures from statusId 6 (Compilation Error) to statusId 13 (Internal Execution Error)
    const isVmOrInfrastructureError = Boolean(
      error &&
        (error.includes("Could not allocate metaspace") ||
         error.includes("Error occurred during initialization of VM") ||
         error.includes("OutOfMemoryError") ||
         error.includes("Cannot allocate memory"))
    );

    if (statusId === 6 && isVmOrInfrastructureError) {
      statusId = 13;
      statusDescription = "Execution Engine Resource Failure";
      this.logger.error("Judge0 misclassified VM infrastructure failure as Compilation Error; normalized to Internal Execution Error (13)", {
        token,
        error,
      });
    }

    return {
      token,
      statusId,
      statusDescription,
      stdout,
      stderr,
      compileOutput,
      message,
      time,
      memory,
      error,
    };
  }

  async checkHealth(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const res = await fetch(`${this.getJudge0Url()}/system_info`, {
        signal: AbortSignal.timeout(3000),
      });
      return { healthy: res.ok, message: res.ok ? "Judge0 reachable" : `HTTP ${res.status}` };
    } catch (err: any) {
      return { healthy: false, message: err?.message || "Unreachable" };
    }
  }
}
