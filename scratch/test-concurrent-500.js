const https = require('https');

const JUDGE0_URL = (process.env.JUDGE0_URL || 'https://15-252-223-20.sslip.io').replace(/\/+$/, '');
const AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || 'dcdc9efc90057ad32baaee18596e5ebe';

function b64(str) {
  return Buffer.from(str).toString('base64');
}

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

// High-capacity HTTPS agent so the laptop doesn't bottle-neck socket connections
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 300,
  maxFreeSockets: 100,
});

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
      agent,
      signal: AbortSignal.timeout(90000), // 90-second client timeout budget
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
  if (!arr.length) return { min: 0, max: 0, p50: 0, p95: 0, p99: 0, avg: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

async function run500() {
  const N = 500;
  console.log("=================================================================");
  console.log(`   EXTREME STRESS TEST: ${N} SIMULTANEOUS CANDIDATE SUBMISSIONS    `);
  console.log("   Target URL: " + JUDGE0_URL);
  console.log("=================================================================\n");

  console.log(`Firing ${N} requests concurrently at the same millisecond...`);
  const startTime = Date.now();

  let completedCount = 0;
  let passedCount = 0;
  let failedCount = 0;

  const promises = [];
  for (let i = 0; i < N; i++) {
    promises.push(
      submitSingle(i + 1).then((res) => {
        completedCount++;
        if (res.success) passedCount++;
        else failedCount++;

        if (completedCount % 50 === 0 || completedCount === N) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          process.stdout.write(
            `\rProgress: ${completedCount}/${N} completed | Passed: ${passedCount} | Failed: ${failedCount} | Elapsed: ${elapsed}s`
          );
        }
        return res;
      })
    );
  }

  const results = await Promise.all(promises);
  const totalElapsed = Date.now() - startTime;

  console.log("\n\n=================================================================");
  console.log("                     500 TEST RESULTS REPORT                     ");
  console.log("=================================================================");
  const passed = results.filter((r) => r.success).length;
  const failed = N - passed;
  const latencies = results.map((r) => r.latency);
  const stats = computePercentiles(latencies);
  const throughput = (N / (totalElapsed / 1000)).toFixed(1);

  console.log(`Total Submissions        : ${N}`);
  console.log(`Passed (Status 3 Accepted): ${passed}/${N} (${((passed / N) * 100).toFixed(1)}%)`);
  console.log(`Failed / Errors          : ${failed}`);
  console.log(`Total Batch Duration     : ${(totalElapsed / 1000).toFixed(2)}s`);
  console.log(`Effective Throughput     : ${throughput} submissions/sec`);
  console.log(`Median Latency (p50)     : ${(stats.p50 / 1000).toFixed(2)}s (${stats.p50} ms)`);
  console.log(`95th Percentile (p95)    : ${(stats.p95 / 1000).toFixed(2)}s (${stats.p95} ms)`);
  console.log(`99th Percentile (p99)    : ${(stats.p99 / 1000).toFixed(2)}s (${stats.p99} ms)`);
  console.log(`Min Latency              : ${stats.min} ms`);
  console.log(`Max Latency              : ${(stats.max / 1000).toFixed(2)}s (${stats.max} ms)`);
  console.log("=================================================================\n");

  if (failed > 0) {
    const errorSample = results.filter((r) => !r.success).slice(0, 5);
    console.log("Error Sample:");
    console.log(errorSample);
  }
}

run500().catch(console.error);
