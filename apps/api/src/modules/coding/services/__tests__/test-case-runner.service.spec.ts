import { TestCaseRunnerService } from "../test-case-runner.service";
import { CodeHarnessService } from "../code-harness.service";
import { NormalizedJudgeResult } from "../judge.service";

describe("TestCaseRunnerService", () => {
  const harness = new CodeHarnessService();
  let submitBatch: jest.Mock;
  let runner: TestCaseRunnerService;

  const judgeResult = (overrides: Partial<NormalizedJudgeResult>): NormalizedJudgeResult => ({
    token: "tok",
    statusId: 3,
    statusDescription: "Accepted",
    stdout: "",
    stderr: "",
    compileOutput: "",
    message: "",
    time: 0.5,
    memory: 20000,
    error: null,
    ...overrides,
  });

  // Builds driver output lines for the nonce the runner put into stdin.
  const driverLines = (stdin: string, cases: Array<Record<string, unknown>>) => {
    const { nonce } = JSON.parse(stdin);
    return cases
      .map((c, i) => `${nonce}${JSON.stringify({ i, s: "ok", o: "", p: "", e: "", ms: 5, ...c })}`)
      .join("\n");
  };

  beforeEach(() => {
    submitBatch = jest.fn();
    runner = new TestCaseRunnerService({ submitBatch } as any, harness);
  });

  it("runs all Java test cases in one execution with a shared CPU budget", async () => {
    submitBatch.mockImplementation(async ([item]: any[]) => [
      {
        result: judgeResult({ stdout: driverLines(item.stdin, [{ o: "6" }, { o: "1" }]) }),
        error: null,
      },
    ]);

    const results = await runner.run(
      "class Solution { public int f(int[] nums) { return 0; } }",
      "java",
      [{ input: { nums: [-2, 1] }, expectedOutput: "6" }, { input: { nums: [1] }, expectedOutput: "1" }],
      { timeoutMs: 40000 },
    );

    expect(submitBatch).toHaveBeenCalledTimes(1);
    const [items, options] = submitBatch.mock.calls[0];
    expect(items).toHaveLength(1);
    const stdin = JSON.parse(items[0].stdin);
    expect(stdin.__iv_multi__).toBe(true);
    expect(stdin.cases).toEqual([{ nums: [-2, 1] }, { nums: [1] }]);
    expect(items[0].expectedOutput).toBeUndefined();
    expect(items[0].cpuTimeLimit).toBe(11);
    expect(items[0].wallTimeLimit).toBe(16);
    expect(options).toEqual({ timeoutMs: 40000 });
    expect(results.map((r) => [r.result?.statusId, r.result?.stdout, r.result?.time])).toEqual([
      [3, "6", 0.005],
      [3, "1", 0.005],
    ]);
  });

  it("caps the CPU budget at Judge0's maximum for long suites", async () => {
    submitBatch.mockResolvedValue([{ result: judgeResult({}), error: null }]);

    await runner.run("def f(x):\n    return x\n", "python", Array.from({ length: 7 }, (_, i) => ({ input: i })));

    expect(submitBatch.mock.calls[0][0][0].cpuTimeLimit).toBe(15);
    expect(submitBatch.mock.calls[0][0][0].wallTimeLimit).toBe(20);
  });

  it("maps per-case runtime errors, time limits and skipped cases", async () => {
    submitBatch.mockImplementation(async ([item]: any[]) => [
      {
        result: judgeResult({
          stdout: driverLines(item.stdin, [
            { s: "error", p: "debug", e: "java.lang.ArithmeticException: / by zero" },
            { s: "tle" },
            { s: "skipped" },
          ]),
        }),
        error: null,
      },
    ]);

    const results = await runner.run("def f(x):\n    return x\n", "python", [{ input: 1 }, { input: 2 }, { input: 3 }]);

    expect(results[0].result).toMatchObject({ statusId: 11, stdout: "debug", error: expect.stringContaining("by zero") });
    expect(results[1].result).toMatchObject({ statusId: 5, error: "Time Limit Exceeded" });
    expect(results[2].result).toMatchObject({ statusId: 5, error: expect.stringContaining("Not run") });
  });

  it("reports a compilation error for every test case", async () => {
    const compileError = judgeResult({ statusId: 6, statusDescription: "Compilation Error", error: "Main.java:1: error" });
    submitBatch.mockResolvedValue([{ result: compileError, error: null }]);

    const results = await runner.run("class Solution {", "java", [{ input: 1 }, { input: 2 }]);

    expect(results.every((r) => r.result?.statusId === 6 && r.result?.error === "Main.java:1: error")).toBe(true);
  });

  it("marks cases the program never reported using the execution's status", async () => {
    submitBatch.mockImplementation(async ([item]: any[]) => [
      {
        result: judgeResult({ statusId: 5, statusDescription: "Time Limit Exceeded", stdout: driverLines(item.stdin, [{ o: "1" }]) }),
        error: null,
      },
    ]);

    const results = await runner.run("def f(x):\n    return x\n", "python", [{ input: 1 }, { input: 2 }]);

    expect(results[0].result).toMatchObject({ statusId: 3, stdout: "1" });
    expect(results[1].result).toMatchObject({ statusId: 5, stdout: "", error: "Time Limit Exceeded" });
  });

  it("passes engine errors through to every case", async () => {
    submitBatch.mockResolvedValue([{ result: null, error: "Judge0 execution service is temporarily unavailable (502)." }]);

    const results = await runner.run("def f(x):\n    return x\n", "python", [{ input: 1 }, { input: 2 }]);

    expect(results).toEqual([
      { result: null, error: "Judge0 execution service is temporarily unavailable (502)." },
      { result: null, error: "Judge0 execution service is temporarily unavailable (502)." },
    ]);
  });

  it("falls back to one submission per case for programs with their own main()", async () => {
    submitBatch.mockResolvedValue([
      { result: judgeResult({ stdout: "3" }), error: null },
      { result: judgeResult({ stdout: "7" }), error: null },
    ]);

    const results = await runner.run(
      "public class Solution { public static void main(String[] a) {} }",
      "java",
      [{ input: { nums: [1, 2] }, expectedOutput: "3" }, { input: { nums: [3, 4] }, expectedOutput: "7" }],
    );

    const items = submitBatch.mock.calls[0][0];
    expect(items).toHaveLength(2);
    expect(items.map((i: any) => i.stdin)).toEqual(["1 2", "3 4"]);
    expect(items.map((i: any) => i.expectedOutput)).toEqual(["3", "7"]);
    expect(results.map((r) => r.result?.stdout)).toEqual(["3", "7"]);
  });
});

describe("CodeHarnessService multi-case output", () => {
  const harness = new CodeHarnessService();

  it("ignores lines without the nonce and keeps per-case order", () => {
    const nonce = "@@IVabc@@";
    const stdout = [
      "candidate debug line",
      `${nonce}{"i":1,"s":"ok","o":"b","p":"","e":"","ms":2}`,
      `${nonce}{"i":0,"s":"ok","o":"a","p":"x","e":"","ms":1}`,
      `${nonce}not json`,
      `${nonce}{"i":9,"s":"ok","o":"z","p":"","e":"","ms":1}`,
    ].join("\n");

    const parsed = harness.parseMultiCaseOutput(stdout, nonce, 3);

    expect(parsed[0]).toEqual({ status: "ok", output: "a", printed: "x", error: "", timeMs: 1 });
    expect(parsed[1]?.output).toBe("b");
    expect(parsed[2]).toBeNull();
  });

  it("encodes every case as typed JSON with the nonce and per-case limit", () => {
    const stdin = JSON.parse(harness.buildMultiCaseStdin([{ nums: [1] }, "[2,3]", "text"], "@@IVn@@", 5000));

    expect(stdin).toEqual({
      __iv_multi__: true,
      nonce: "@@IVn@@",
      caseTimeoutMs: 5000,
      cases: [{ nums: [1] }, [2, 3], "text"],
    });
  });
});
