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

      expect(global.fetch).toHaveBeenCalledTimes(1);
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
        } as any);

      const result = await judgeService.submitAndPoll({
        sourceCode: "console.log('Hello World')",
        language: "javascript",
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
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
  });
});
