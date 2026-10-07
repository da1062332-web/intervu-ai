/**
 * Load test for the Judge0 execution server, using the same code path the API
 * uses for a candidate "Run" (CodeHarnessService + JudgeService.submitBatch).
 *
 * It sends real work to the Judge0 server in JUDGE0_URL, so run it only at a
 * time you chose, never during an exam. Requires --confirm.
 *
 * Usage (from apps/api, with JUDGE0_URL / JUDGE0_AUTH_TOKEN / JUDGE0_AUTHZ_TOKEN
 * in .env or the environment):
 *   npx ts-node --transpile-only scripts/load-test-judge0.ts --runs 50 --lang java --confirm
 *
 * Options:
 *   --runs N         simulated candidate Runs in total               (default 10)
 *   --concurrency N  Runs in flight at once; the API caps this at
 *                    CODE_EXECUTION_CONCURRENCY x API instances      (default 60)
 *   --lang L         java | python                                   (default python)
 *   --cases N        test cases per Run (Run = 2, Submit = 7)        (default 2)
 *   --timeout MS     per-Run Judge0 budget, as in the API            (default 40000)
 */
import "dotenv/config";
import { CodeHarnessService } from "../src/modules/coding/services/code-harness.service";
import { JudgeService } from "../src/modules/coding/services/judge.service";

const SOLUTIONS: Record<string, string> = {
  java: `class Solution {
    public int maxSubArray(int[] nums) {
        int best = nums[0], cur = 0;
        for (int x : nums) { cur = Math.max(x, cur + x); best = Math.max(best, cur); }
        return best;
    }
}`,
  python: `def max_sub_array(nums):
    best = nums[0]
    cur = 0
    for x in nums:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best
`,
};

const TEST_CASES = [
  { input: { nums: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }, expected: "6" },
  { input: { nums: [1] }, expected: "1" },
  { input: { nums: [5, 4, -1, 7, 8] }, expected: "23" },
  { input: { nums: [-3, -2, -5] }, expected: "-2" },
  { input: { nums: [2, -1, 2, 3, -9, 4] }, expected: "6" },
  { input: { nums: [0, 0, 0] }, expected: "0" },
  { input: { nums: [8, -19, 5, -4, 20] }, expected: "21" },
];

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

type RunOutcome = "ok" | "wrong" | "timeout" | "error";

async function main() {
  const runs = Number(arg("runs", "10"));
  const concurrency = Number(arg("concurrency", "60"));
  const lang = arg("lang", "python");
  const casesPerRun = Math.min(Number(arg("cases", "2")), TEST_CASES.length);
  const timeoutMs = Number(arg("timeout", "40000"));

  if (!process.argv.includes("--confirm")) {
    console.error("This sends real load to the Judge0 server in JUDGE0_URL. Re-run with --confirm.");
    process.exit(1);
  }
  if (!SOLUTIONS[lang]) {
    console.error(`--lang must be one of: ${Object.keys(SOLUTIONS).join(", ")}`);
    process.exit(1);
  }

  // Keep per-batch info logs out of the report.
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || "error";

  const harness = new CodeHarnessService();
  const judge = new JudgeService();
  const program = harness.prepare(SOLUTIONS[lang], lang);
  const tests = TEST_CASES.slice(0, casesPerRun);

  console.log(
    `Judge0 load test: ${runs} Runs x ${casesPerRun} cases (${lang}), ${concurrency} in flight, ` +
      `timeout ${timeoutMs} ms, target ${judge.getJudge0Url()}\n`,
  );

  const latencies: number[] = [];
  const outcomes: Record<RunOutcome, number> = { ok: 0, wrong: 0, timeout: 0, error: 0 };
  const errorSamples = new Set<string>();
  let next = 0;
  const started = Date.now();

  async function simulateRun(): Promise<void> {
    const t0 = Date.now();
    const results = await judge.submitBatch(
      tests.map((t) => ({
        sourceCode: program.sourceCode,
        language: lang,
        stdin: harness.buildStdin(t.input, program.stdinMode),
      })),
      { timeoutMs },
    );
    latencies.push(Date.now() - t0);

    let outcome: RunOutcome = "ok";
    results.forEach((r, i) => {
      if (!r.result) {
        const timedOut = /timed out/i.test(r.error || "");
        if (timedOut && outcome === "ok") outcome = "timeout";
        if (!timedOut) outcome = "error";
        if (r.error) errorSamples.add(r.error.slice(0, 160));
      } else if ((r.result.stdout || "").trim() !== tests[i].expected) {
        if (outcome === "ok") outcome = "wrong";
        if (r.result.error) errorSamples.add(r.result.error.slice(0, 160));
      }
    });
    outcomes[outcome]++;
  }

  async function lane(): Promise<void> {
    while (next < runs) {
      next++;
      await simulateRun();
      const done = latencies.length;
      if (done % Math.max(1, Math.floor(runs / 10)) === 0) {
        process.stdout.write(`  ${done}/${runs} Runs finished (${((Date.now() - started) / 1000).toFixed(1)} s)\n`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, runs) }, () => lane()));

  const wallSeconds = (Date.now() - started) / 1000;
  const sorted = [...latencies].sort((a, b) => a - b);

  console.log("\nResults");
  console.log(`  Runs:              ${runs}  (ok ${outcomes.ok}, wrong ${outcomes.wrong}, timeout ${outcomes.timeout}, error ${outcomes.error})`);
  console.log(`  Success rate:      ${((outcomes.ok / runs) * 100).toFixed(1)}%`);
  console.log(`  Wall time:         ${wallSeconds.toFixed(1)} s`);
  console.log(`  Throughput:        ${((runs * casesPerRun) / wallSeconds).toFixed(2)} submissions/s, ${(runs / wallSeconds).toFixed(2)} Runs/s`);
  console.log(`  Run latency (ms):  p50 ${percentile(sorted, 50)}, p95 ${percentile(sorted, 95)}, max ${sorted[sorted.length - 1] ?? 0}`);
  if (errorSamples.size > 0) {
    console.log("  Error samples:");
    for (const e of Array.from(errorSamples).slice(0, 5)) console.log(`    - ${e}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
