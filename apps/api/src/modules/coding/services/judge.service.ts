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
  wallTimeLimit?: number; // seconds; Judge0 default when omitted
  memoryLimit?: number; // KB
  compilerOptions?: string;
}

/** One entry per submitted test case, in the order they were passed in. */
export interface JudgeBatchItemResult {
  result: NormalizedJudgeResult | null;
  error: string | null;
}

export interface JudgeBatchOptions {
  /** Overall budget for creating the batch and waiting for every result. */
  timeoutMs?: number;
}

// Judge0 1.13.1 MAX_SUBMISSION_BATCH_SIZE default.
const MAX_BATCH_SIZE = 20;
const DEFAULT_BATCH_TIMEOUT_MS = 40_000;
const BATCH_POLL_DELAYS_MS = [300, 500, 750, 1000, 1500];
const BATCH_RESULT_FIELDS = "token,status,stdout,stderr,compile_output,message,time,memory";
const EXECUTION_TIMEOUT_MESSAGE = "Code execution timed out while waiting for Judge0 worker evaluation.";

class RetryableBatchError extends Error {}

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
    let url = (process.env.JUDGE0_URL || "http://localhost:2358").trim();
    url = url.replace(/\/+$/, "");
    url = url.replace(/\/submissions$/, "");
    return url;
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
    // Judge0 only allows DELETE /submissions/:token when AUTHZ_TOKEN is set
    // and sent as X-Auth-User; without it, cleanup returns 403.
    const authzToken = process.env.JUDGE0_AUTHZ_TOKEN;
    if (authzToken) {
      headers["X-Auth-User"] = authzToken;
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

    const compilerOptions = options.compilerOptions;

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
            signal: AbortSignal.timeout(15000),
          },
        );

        if (!res.ok) {
          const errText = await res.text();
          this.logger.warn(`Judge0 submission HTTP error (Attempt ${attempt}/${maxAttempts})`, {
            status: res.status,
            response: errText,
          });

          const isNgrokOffline =
            errText.includes("ERR_NGROK_3200") ||
            (errText.includes("tunnel") && errText.includes("not found"));

          if (isNgrokOffline || attempt >= maxAttempts) {
            const detailMsg = isNgrokOffline
              ? "Coding evaluation engine is temporarily offline (Judge0 execution tunnel inactive). Please ensure the ngrok tunnel or execution server is online."
              : res.status === 404
                ? `Judge0 execution service returned error: Not Found (404) at ${judge0Url}/submissions. If using ngrok or a deployed server, please ensure: 1) ngrok is forwarding to port 2358 ('ngrok http 2358'), NOT port 3000/4000; 2) JUDGE0_URL is the base URL (e.g. 'https://xxxx.ngrok-free.app') without /submissions; 3) Judge0 Docker container is active.`
                : `Judge0 execution service returned error: ${res.statusText} (${res.status})`;
            throw new InternalServerErrorException(detailMsg);
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
        const errMsg = String(err?.message || err);
        const isNgrokOffline = errMsg.includes("ERR_NGROK_3200") || (errMsg.includes("tunnel") && errMsg.includes("not found"));
        if (isNgrokOffline) {
          throw new InternalServerErrorException(
            "Coding evaluation engine is temporarily offline (Judge0 execution tunnel inactive). Please ensure the ngrok tunnel or execution server is online.",
          );
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
    const maxPolls = 60;
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
    this.logger.info("Judge0 execution evaluated", {
      token,
      languageId,
      statusId: normalized.statusId,
      statusDescription: normalized.statusDescription,
      time: normalized.time,
      memory: normalized.memory,
      hasError: Boolean(normalized.error),
    });
    // Auto-clean submission artifacts from Judge0 memory/storage
    this.deleteSubmission(token).catch(() => null);
    return normalized;
  }

  /**
   * Runs several test cases as one Judge0 batch without `wait=true`, so the
   * code runs in Judge0's worker processes instead of holding one of its few
   * web threads, and all test cases of a Run/Submit execute in parallel.
   *
   * Creation is retried only when Judge0 provably did not accept the batch
   * (network error before a response, 502/503). Once accepted it is never
   * re-sent: a slow result is waited on, not re-executed. Results that are
   * still pending when `timeoutMs` runs out come back as per-item errors.
   */
  async submitBatch(
    items: JudgeSubmissionOptions[],
    options: JudgeBatchOptions = {},
  ): Promise<JudgeBatchItemResult[]> {
    if (items.length === 0) return [];

    const deadline = Date.now() + (options.timeoutMs ?? DEFAULT_BATCH_TIMEOUT_MS);
    const results: JudgeBatchItemResult[] = new Array(items.length);

    const chunks: number[][] = [];
    for (let start = 0; start < items.length; start += MAX_BATCH_SIZE) {
      chunks.push(
        Array.from({ length: Math.min(MAX_BATCH_SIZE, items.length - start) }, (_, k) => start + k),
      );
    }

    await Promise.all(
      chunks.map(async (indices) => {
        const chunkResults = await this.runBatchChunk(
          indices.map((i) => items[i]),
          deadline,
        );
        indices.forEach((itemIndex, k) => {
          results[itemIndex] = chunkResults[k];
        });
      }),
    );

    return results;
  }

  private async runBatchChunk(
    items: JudgeSubmissionOptions[],
    deadline: number,
  ): Promise<JudgeBatchItemResult[]> {
    const judge0Url = this.getJudge0Url();

    let created: any[];
    try {
      created = await this.createBatch(judge0Url, items, deadline);
    } catch (err: any) {
      const message = err?.message || "Judge0 execution engine error";
      return items.map(() => ({ result: null, error: message }));
    }

    const tokens: (string | null)[] = items.map((_, k) =>
      typeof created?.[k]?.token === "string" ? created[k].token : null,
    );
    const results: (JudgeBatchItemResult | null)[] = items.map((_, k) =>
      tokens[k]
        ? null
        : {
            result: null,
            error: `Judge0 rejected the submission: ${JSON.stringify(created?.[k] ?? {})}`,
          },
    );

    const pendingTokens = (): string[] =>
      tokens.filter((t, k): t is string => Boolean(t) && results[k] === null);

    let pollIndex = 0;
    while (pendingTokens().length > 0 && Date.now() < deadline) {
      const delay =
        process.env.NODE_ENV === "test"
          ? 10
          : BATCH_POLL_DELAYS_MS[Math.min(pollIndex, BATCH_POLL_DELAYS_MS.length - 1)];
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, Math.max(0, deadline - Date.now()))));
      pollIndex++;

      const pending = pendingTokens();
      try {
        const res = await fetch(
          `${judge0Url}/submissions/batch?tokens=${pending.join(",")}&base64_encoded=true&fields=${BATCH_RESULT_FIELDS}`,
          {
            headers: this.getJudge0Headers(),
            signal: AbortSignal.timeout(10000),
          },
        );
        if (!res.ok) {
          this.logger.warn("Judge0 batch poll HTTP error", { status: res.status });
          continue;
        }
        const body: any = await res.json();
        const polled: any[] = Array.isArray(body?.submissions) ? body.submissions : [];
        for (const sub of polled) {
          const statusId = sub?.status?.id;
          if (!sub?.token || statusId === undefined || statusId === 1 || statusId === 2) continue;
          const k = tokens.indexOf(sub.token);
          if (k >= 0 && results[k] === null) {
            results[k] = { result: this.normalizeResult(sub.token, sub), error: null };
          }
        }
      } catch (pollErr: any) {
        this.logger.warn("Judge0 batch poll failed", { error: pollErr?.message || String(pollErr) });
      }
    }

    const finished = results.map((r) => r ?? { result: null, error: EXECUTION_TIMEOUT_MESSAGE });

    this.logger.info("Judge0 batch evaluated", {
      size: items.length,
      statuses: finished.map((r) => r.result?.statusId ?? "error"),
      timedOut: results.filter((r) => r === null).length,
    });

    // Auto-clean submission artifacts from Judge0 storage. Still-running
    // submissions cannot be deleted (Judge0 answers 400) and are left behind.
    for (const token of tokens) {
      if (token) this.deleteSubmission(token).catch(() => null);
    }

    return finished;
  }

  private async createBatch(
    judge0Url: string,
    items: JudgeSubmissionOptions[],
    deadline: number,
  ): Promise<any[]> {
    const body = JSON.stringify({ submissions: items.map((item) => this.buildPayload(item)) });
    const maxAttempts = 3;

    for (let attempt = 1; ; attempt++) {
      try {
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) {
          throw new GatewayTimeoutException(EXECUTION_TIMEOUT_MESSAGE);
        }
        const res = await fetch(`${judge0Url}/submissions/batch?base64_encoded=true`, {
          method: "POST",
          headers: this.getJudge0Headers(),
          body,
          signal: AbortSignal.timeout(Math.min(15000, remainingMs)),
        });

        if (res.ok) {
          // Judge0 accepted the batch: from here nothing may be re-sent.
          const created = await res.json().catch(() => null);
          if (!Array.isArray(created)) {
            throw new InternalServerErrorException("Judge0 returned an unexpected batch response.");
          }
          return created;
        }

        const errText = await res.text();
        this.logger.warn(`Judge0 batch create HTTP error (Attempt ${attempt}/${maxAttempts})`, {
          status: res.status,
          response: errText.slice(0, 500),
        });
        // 502: Caddy could not reach Judge0; 503: Judge0 queue full. Neither
        // created anything, so a retry cannot run the code twice.
        if (res.status === 502 || res.status === 503) {
          throw new RetryableBatchError(
            res.status === 503
              ? "The code execution engine is at capacity. Please try again in a few seconds."
              : "Judge0 execution service is temporarily unavailable (502).",
          );
        }
        throw new InternalServerErrorException(
          `Judge0 execution service returned error: ${res.statusText} (${res.status})`,
        );
      } catch (err: any) {
        const isAbort = err?.name === "TimeoutError" || err?.name === "AbortError";
        const isRetryable =
          err instanceof RetryableBatchError ||
          (!isAbort && !(err instanceof InternalServerErrorException) && !(err instanceof GatewayTimeoutException));

        if (!isRetryable || attempt >= maxAttempts) {
          if (isAbort) {
            // The request may have reached Judge0, so it is not re-sent.
            throw new GatewayTimeoutException(EXECUTION_TIMEOUT_MESSAGE);
          }
          if (err instanceof RetryableBatchError) {
            throw new InternalServerErrorException(err.message);
          }
          if (err instanceof InternalServerErrorException || err instanceof GatewayTimeoutException) {
            throw err;
          }
          throw new InternalServerErrorException(
            `Unable to connect to Judge0 execution service at ${judge0Url} after ${attempt} attempts. Please ensure Judge0 is running.`,
          );
        }

        this.logger.warn(`Judge0 batch create attempt ${attempt}/${maxAttempts} failed; retrying`, {
          url: judge0Url,
          error: err?.message || String(err),
        });
        await new Promise((resolve) => setTimeout(resolve, process.env.NODE_ENV === "test" ? 1 : attempt * 500));
      }
    }
  }

  private buildPayload(options: JudgeSubmissionOptions) {
    return {
      source_code: this.encodeBase64(options.sourceCode),
      language_id: this.mapLanguageToId(options.language),
      stdin: this.encodeBase64(options.stdin || ""),
      expected_output: options.expectedOutput
        ? this.encodeBase64(options.expectedOutput)
        : undefined,
      cpu_time_limit: options.cpuTimeLimit ?? 5,
      wall_time_limit: options.wallTimeLimit,
      memory_limit: options.memoryLimit ?? 2048000,
      compiler_options: options.compilerOptions,
    };
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
