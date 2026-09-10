const http = require('http');
const { execSync } = require('child_process');

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

function b64(str) { return Buffer.from(str).toString('base64'); }

const JAVA_CODE = b64(`public class Main {
    public static void main(String[] args) {
        int sum = 0;
        for (int i = 0; i < 50000; i++) sum += (i % 7);
        System.out.println("Java OK: " + sum);
    }
}`);

function submitSync(payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const start = Date.now();
    const parsedUrl = new URL(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`);
    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'intervu-sustained-tester'
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        const wallLatency = Date.now() - start;
        try {
          const parsed = JSON.parse(body);
          resolve({ httpStatus: res.statusCode, wallLatency, ...parsed });
        } catch (e) {
          resolve({ httpStatus: res.statusCode, wallLatency, error: e.message });
        }
      });
    });
    req.on('error', (err) => resolve({ httpStatus: 0, wallLatency: Date.now() - start, error: err.message }));
    req.write(data);
    req.end();
  });
}

function computeStats(arr) {
  if (!arr.length) return { min: 0, max: 0, p50: 0, p95: 0, mean: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)]
  };
}

async function runSustained(concurrency, durationSeconds) {
  console.log(`\n================================================================`);
  console.log(`PHASE 8: SUSTAINED LOAD — CONCURRENCY = ${concurrency} FOR ${durationSeconds}s (${(durationSeconds/60).toFixed(1)} mins)`);
  console.log(`================================================================`);

  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;
  let totalSubmitted = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  const latencies = [];
  const windowLatencies = [];

  let isRunning = true;

  // Periodic metrics logger (every 30 seconds)
  const reportInterval = setInterval(() => {
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(0);
    const recentStats = computeStats(windowLatencies);
    windowLatencies.length = 0; // Clear rolling window
    const currentThroughput = (totalPassed / ((Date.now() - startTime) / 1000)).toFixed(2);

    let redisMem = 'N/A';
    let pgConns = 'N/A';
    try {
      redisMem = execSync('docker exec intervu-redis redis-cli info memory').toString().match(/used_memory_human:(.*)/)?.[1]?.trim() || 'N/A';
      pgConns = execSync('docker exec intervu-postgres psql -U postgres -d judge0 -t -c "SELECT count(*) FROM pg_stat_activity;"').toString().trim() || 'N/A';
    } catch(e) {}

    console.log(`[T+${elapsedSec}s] Completed: ${totalPassed} | Errors: ${totalFailed} | Rate: ${currentThroughput} req/s | Rolling p50: ${recentStats.p50}ms | Rolling p95: ${recentStats.p95}ms | Redis RAM: ${redisMem} | PG Conns: ${pgConns}`);
  }, 30000);

  // Worker loop for each concurrent slot
  async function workerSlot(slotId) {
    while (Date.now() < endTime && isRunning) {
      totalSubmitted++;
      const res = await submitSync({ source_code: JAVA_CODE, language_id: 62 });
      if (res.status?.id === 3) {
        totalPassed++;
      } else {
        totalFailed++;
      }
      latencies.push(res.wallLatency);
      windowLatencies.push(res.wallLatency);
    }
  }

  // Launch all concurrent slots
  const slots = [];
  for (let i = 0; i < concurrency; i++) {
    slots.push(workerSlot(i));
  }

  await Promise.all(slots);
  isRunning = false;
  clearInterval(reportInterval);

  const totalDuration = (Date.now() - startTime) / 1000;
  const stats = computeStats(latencies);

  console.log(`\n--- SUMMARY FOR CONCURRENCY = ${concurrency} (${totalDuration.toFixed(1)}s) ---`);
  console.log(`Total Completed   : ${totalPassed}/${totalSubmitted} (${((totalPassed/totalSubmitted)*100).toFixed(1)}%)`);
  console.log(`Total Errors      : ${totalFailed}`);
  console.log(`Average Throughput: ${(totalPassed / totalDuration).toFixed(2)} req/s`);
  console.log(`Latency p50       : ${stats.p50}ms`);
  console.log(`Latency p95       : ${stats.p95}ms`);
  console.log(`Latency Max       : ${stats.max}ms`);
  console.log(`Latency Min       : ${stats.min}ms`);
  console.log("================================================================");

  return {
    concurrency,
    duration: totalDuration,
    submitted: totalSubmitted,
    passed: totalPassed,
    failed: totalFailed,
    throughput: (totalPassed / totalDuration).toFixed(2),
    stats
  };
}

async function main() {
  // Run 50 concurrent for 5 minutes (300s)
  const res50 = await runSustained(50, 300);

  // 10s cool down
  await new Promise(r => setTimeout(r, 10000));

  // Run 100 concurrent for 5 minutes (300s)
  const res100 = await runSustained(100, 300);

  console.log("\n================================================================");
  console.log("          PHASE 8 SUSTAINED LOAD FINAL COMPARISON               ");
  console.log("================================================================");
  console.log(`N=50  (5m): ${res50.passed}/${res50.submitted} passed | ${res50.throughput} req/s | p50: ${res50.stats.p50}ms | p95: ${res50.stats.p95}ms | Errors: ${res50.failed}`);
  console.log(`N=100 (5m): ${res100.passed}/${res100.submitted} passed | ${res100.throughput} req/s | p50: ${res100.stats.p50}ms | p95: ${res100.stats.p95}ms | Errors: ${res100.failed}`);
}

main().catch(console.error);
