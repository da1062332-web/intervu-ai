import { JudgeService } from "../judge.service";
import { BadRequestException, GatewayTimeoutException, InternalServerErrorException } from "@nestjs/common";

describe("JudgeService", () => {
  let judgeService: JudgeService;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    judgeService = new JudgeService();
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  describe("mapLanguageToId", () => {
    it("should map common language aliases correctly", () => {
      expect(judgeService.mapLanguageToId("python")).toBe(71);
      expect(judgeService.mapLanguageToId("py")).toBe(71);
      expect(judgeService.mapLanguageToId("java")).toBe(62);
      expect(judgeService.mapLanguageToId("cpp")).toBe(54);
      expect(judgeService.mapLanguageToId("c++")).toBe(54);
      expect(judgeService.mapLanguageToId("javascript")).toBe(63);
      expect(judgeService.mapLanguageToId("typescript")).toBe(74);
      expect(judgeService.mapLanguageToId("go")).toBe(60);
      expect(judgeService.mapLanguageToId("rust")).toBe(73);
      expect(judgeService.mapLanguageToId("c#")).toBe(51);
    });

    it("should return numeric ID directly when passed as number or numeric string", () => {
      expect(judgeService.mapLanguageToId(71)).toBe(71);
      expect(judgeService.mapLanguageToId("71")).toBe(71);
      expect(judgeService.mapLanguageToId("62")).toBe(62);
    });

    it("should throw BadRequestException for unknown languages", () => {
      expect(() => judgeService.mapLanguageToId("brainfuck")).toThrow(
        BadRequestException,
      );
    });
  });

  describe("submitAndPoll", () => {
    it("should send base64 encoded payload and return normalized result when Judge0 responds with wait=true", async () => {
      const mockResponse = {
        token: "test-token-123",
        status: { id: 3, description: "Accepted" },
        stdout: Buffer.from("42\n").toString("base64"),
        stderr: "",
        compile_output: "",
        message: "",
        time: "0.012",
        memory: 12500,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await judgeService.submitAndPoll({
        sourceCode: "print(42)",
        language: "python",
        stdin: "",
      });

      expect(global.fetch).toHaveBeenCalledTimes(2); // Submit (1) + Delete/Cleanup (1)
      expect(result.token).toBe("test-token-123");
      expect(result.statusId).toBe(3);
      expect(result.statusDescription).toBe("Accepted");
      expect(result.stdout).toBe("42\n");
      expect(result.error).toBeNull();
      expect(result.time).toBe(0.012);
      expect(result.memory).toBe(12500);
    });

    it("should poll when initial status is in queue or processing", async () => {
      const initialResponse = {
        token: "poll-token",
        status: { id: 1, description: "In Queue" },
      };

      const completedResponse = {
        token: "poll-token",
        status: { id: 3, description: "Accepted" },
        stdout: Buffer.from("Hello World").toString("base64"),
        time: "0.05",
        memory: 15000,
      };

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(initialResponse),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(completedResponse),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({}),
        } as any);

      const result = await judgeService.submitAndPoll({
        sourceCode: "console.log('Hello World')",
        language: "javascript",
      });

      expect(global.fetch).toHaveBeenCalledTimes(3); // Submit (1) + Poll (1) + Delete/Cleanup (1)
      expect(result.statusId).toBe(3);
      expect(result.stdout).toBe("Hello World");
    });

    it("should handle compilation error and populate error message correctly", async () => {
      const compileErrResponse = {
        token: "err-token",
        status: { id: 6, description: "Compilation Error" },
        compile_output: Buffer.from("SyntaxError: unexpected EOF").toString("base64"),
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(compileErrResponse),
      } as any);

      const result = await judgeService.submitAndPoll({
        sourceCode: "def foo(",
        language: "python",
      });

      expect(result.statusId).toBe(6);
      expect(result.error).toBe("SyntaxError: unexpected EOF");
    });

    it("should throw GatewayTimeoutException if submission stays in queue after max polls", async () => {
      const inQueueResponse = {
        token: "stuck-token",
        status: { id: 1, description: "In Queue" },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(inQueueResponse),
      } as any);

      await expect(
        judgeService.submitAndPoll({
          sourceCode: "while True: pass",
          language: "python",
        }),
      ).rejects.toThrow(GatewayTimeoutException);
    });

    it("should throw InternalServerErrorException if connection to Judge0 fails", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(
        judgeService.submitAndPoll({
          sourceCode: "print(1)",
          language: "python",
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("should fast-fail immediately when ngrok tunnel is offline (ERR_NGROK_3200)", async () => {
      const ngrokErrHtml =
        "<html><body>tunnel marbled-fifty-unraveled.ngrok-free.dev not found. ERR_NGROK_3200</body></html>";
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue(ngrokErrHtml),
      } as any);

      await expect(
        judgeService.submitAndPoll({
          sourceCode: "print(1)",
          language: "python",
        }),
      ).rejects.toThrow("Coding evaluation engine is temporarily offline");

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("submitBatch", () => {
    const b64 = (s: string) => Buffer.from(s).toString("base64");
    const jsonResponse = (body: any, status = 200) =>
      ({
        ok: status >= 200 && status < 300,
        status,
        statusText: String(status),
        json: jest.fn().mockResolvedValue(body),
        text: jest.fn().mockResolvedValue(JSON.stringify(body)),
      }) as any;
    const items = [
      { sourceCode: "print(1)", language: "python", stdin: "1" },
      { sourceCode: "print(1)", language: "python", stdin: "2" },
    ];
    const callsTo = (fetchMock: jest.Mock, pattern: RegExp, method = "GET") =>
      fetchMock.mock.calls.filter(
        ([url, init]: any[]) => pattern.test(url) && (init?.method || "GET") === method,
      );

    it("creates one batch without wait and returns results in input order", async () => {
      const fetchMock = jest.fn(async (url: string, init?: any) => {
        if (init?.method === "POST") return jsonResponse([{ token: "a" }, { token: "b" }]);
        if (init?.method === "DELETE") return jsonResponse({});
        return jsonResponse({
          submissions: [
            { token: "b", status: { id: 4, description: "Wrong Answer" }, stdout: b64("2\n"), time: "0.02", memory: 900 },
            { token: "a", status: { id: 3, description: "Accepted" }, stdout: b64("1\n"), time: "0.01", memory: 800 },
          ],
        });
      });
      global.fetch = fetchMock as any;

      const results = await judgeService.submitBatch(items);

      const [postUrl, postInit] = callsTo(fetchMock, /\/submissions\/batch/, "POST")[0];
      expect(postUrl).toContain("/submissions/batch?base64_encoded=true");
      expect(postUrl).not.toContain("wait=");
      expect(JSON.parse(postInit.body).submissions).toHaveLength(2);
      expect(results.map((r) => r.result?.stdout)).toEqual(["1\n", "2\n"]);
      expect(results.map((r) => r.result?.statusId)).toEqual([3, 4]);
      expect(callsTo(fetchMock, /\/submissions\/[ab]$/, "DELETE")).toHaveLength(2);
    });

    it("keeps polling only the submissions that are still running", async () => {
      let polls = 0;
      const fetchMock = jest.fn(async (url: string, init?: any) => {
        if (init?.method === "POST") return jsonResponse([{ token: "a" }, { token: "b" }]);
        if (init?.method === "DELETE") return jsonResponse({});
        polls++;
        return jsonResponse({
          submissions:
            polls === 1
              ? [
                  { token: "a", status: { id: 3, description: "Accepted" }, stdout: b64("1") },
                  { token: "b", status: { id: 2, description: "Processing" } },
                ]
              : [{ token: "b", status: { id: 3, description: "Accepted" }, stdout: b64("2") }],
        });
      });
      global.fetch = fetchMock as any;

      const results = await judgeService.submitBatch(items);

      const pollUrls = callsTo(fetchMock, /\/submissions\/batch\?tokens=/).map(([u]: any[]) => u);
      expect(pollUrls[0]).toContain("tokens=a,b");
      expect(pollUrls[1]).toContain("tokens=b&");
      expect(results.map((r) => r.result?.stdout)).toEqual(["1", "2"]);
    });

    it("reports still-running submissions as timed out without re-submitting them", async () => {
      const fetchMock = jest.fn(async (url: string, init?: any) => {
        if (init?.method === "POST") return jsonResponse([{ token: "a" }, { token: "b" }]);
        if (init?.method === "DELETE") return jsonResponse({});
        return jsonResponse({
          submissions: [
            { token: "a", status: { id: 3, description: "Accepted" }, stdout: b64("1") },
            { token: "b", status: { id: 1, description: "In Queue" } },
          ],
        });
      });
      global.fetch = fetchMock as any;

      const results = await judgeService.submitBatch(items, { timeoutMs: 60 });

      expect(results[0].result?.stdout).toBe("1");
      expect(results[1].result).toBeNull();
      expect(results[1].error).toMatch(/timed out/i);
      expect(callsTo(fetchMock, /\/submissions\/batch/, "POST")).toHaveLength(1);
    });

    it("retries creation when Judge0 rejects it with 503 (queue full)", async () => {
      let posts = 0;
      const fetchMock = jest.fn(async (url: string, init?: any) => {
        if (init?.method === "POST") {
          posts++;
          return posts === 1 ? jsonResponse({ error: "queue is full" }, 503) : jsonResponse([{ token: "a" }]);
        }
        if (init?.method === "DELETE") return jsonResponse({});
        return jsonResponse({ submissions: [{ token: "a", status: { id: 3, description: "Accepted" }, stdout: b64("ok") }] });
      });
      global.fetch = fetchMock as any;

      const results = await judgeService.submitBatch([items[0]]);

      expect(posts).toBe(2);
      expect(results[0].result?.stdout).toBe("ok");
    });

    it("does not re-send the batch when the create request times out", async () => {
      const timeout = Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" });
      const fetchMock = jest.fn().mockRejectedValue(timeout);
      global.fetch = fetchMock as any;

      const results = await judgeService.submitBatch(items);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(results.every((r) => r.result === null && /timed out/i.test(r.error || ""))).toBe(true);
    });

    it("turns per-item validation errors into item errors", async () => {
      const fetchMock = jest.fn(async (url: string, init?: any) => {
        if (init?.method === "POST") return jsonResponse([{ token: "a" }, { language_id: ["is not valid"] }]);
        if (init?.method === "DELETE") return jsonResponse({});
        return jsonResponse({ submissions: [{ token: "a", status: { id: 3, description: "Accepted" }, stdout: b64("1") }] });
      });
      global.fetch = fetchMock as any;

      const results = await judgeService.submitBatch(items);

      expect(results[0].result?.stdout).toBe("1");
      expect(results[1].result).toBeNull();
      expect(results[1].error).toContain("is not valid");
    });
  });
});
