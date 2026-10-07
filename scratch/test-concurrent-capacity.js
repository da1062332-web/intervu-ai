const JUDGE0_URL = (process.env.JUDGE0_URL || 'https://15-252-223-20.sslip.io').replace(/\/+$/, '');
const AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || 'dcdc9efc90057ad32baaee18596e5ebe';

function b64(str) {
  return Buffer.from(str).toString('base64');
}

// Typical candidate solutions
const PYTHON_CODE = b64(`
import sys
def solve():
    s = 0
    for i in range(10000):
        s += i
    print(s)
if __name__ == '__main__':
    solve()
`);

async function submitSingle(testId) {
  const start = Date.now();
  try {
    const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': AUTH_TOKEN,
      },
      body: JSON.stringify({
        source_code: PYTHON_CODE,
        language_id: 71,
      }),
      signal: AbortSignal.timeout(30000),
    });

    const latency = Date.now() - start;
    if (!res.ok) {
      return { id: testId, success: false, status: res.status, latency, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const isAccepted = data.status?.id === 3;
    return {
      id: testId,
      success: isAccepted,
      statusId: data.status?.id,
      statusDesc: data.status?.description,
      latency,
      execTime: parseFloat(data.time || 0),
      memory: data.memory,
    };
  } catch (err) {
    return {
      id: testId,
      success: false,
      latency: Date.now() - start,
      error: err.message,
    };
  }
}

function computePercentiles(arr) {
  if (!arr.length) return { min: 0, max: 0, p50: 0, p95: 0, avg: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
  };
}

async function runConcurrencyLevel(concurrentUsers) {
  process.stdout.write(`Testing ${concurrentUsers} simultaneous candidates... `);
  const startTime = Date.now();

  const promises = [];
  for (let i = 0; i < concurrentUsers; i++) {
    promises.push(submitSingle(i + 1));
  }

  const results = await Promise.all(promises);
  const totalElapsed = Date.now() - startTime;

  const passed = results.filter((r) => r.success).length;
  const failed = concurrentUsers - passed;
  const latencies = results.map((r) => r.latency);
  const stats = computePercentiles(latencies);
  const throughput = (concurrentUsers / (totalElapsed / 1000)).toFixed(1);

  console.log(`\n  ✅ Passed: ${passed}/${concurrentUsers} (${((passed / concurrentUsers) * 100).toFixed(1)}%) | Failed: ${failed}`);
  console.log(`  ⏱️ Total Batch Duration : ${(totalElapsed / 1000).toFixed(2)}s`);
  console.log(`  🚀 Throughput            : ${throughput} executions/sec`);
  console.log(`  📊 Latency (p50 / median): ${stats.p50} ms`);
  console.log(`  📊 Latency (p95)         : ${stats.p95} ms`);
  console.log(`  📊 Latency (max)         : ${stats.max} ms`);

  return { concurrentUsers, passed, failed, totalElapsed, throughput: parseFloat(throughput), stats };
}

async function main() {
  console.log("=================================================================");
  console.log("   AWS JUDGE0 CONCURRENT CAPACITY & STRESS BENCHMARK             ");
  console.log("   Target URL: " + JUDGE0_URL);
  console.log("=================================================================\n");

  const levels = [10, 25, 50, 100];
  const summary = [];

  for (const n of levels) {
    const res = await runConcurrencyLevel(n);
    summary.push(res);
    // 2-second cooldown between test bursts
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n=================================================================");
  console.log("                     CAPACITY SUMMARY TABLE                      ");
  console.log("=================================================================");
  console.log("Simultaneous | Success Rate | Throughput   | Median (p50) | p95 Latency");
  console.log("-----------------------------------------------------------------");
  for (const s of summary) {
    const rate = `${((s.passed / s.concurrentUsers) * 100).toFixed(0)}%`;
    console.log(
      `${String(s.concurrentUsers).padEnd(12)} | ` +
      `${rate.padEnd(12)} | ` +
      `${(s.throughput + ' req/s').padEnd(12)} | ` +
      `${(s.stats.p50 + ' ms').padEnd(12)} | ` +
      `${s.stats.p95 + ' ms'}`
    );
  }
  console.log("=================================================================\n");
}

main().catch(console.error);
