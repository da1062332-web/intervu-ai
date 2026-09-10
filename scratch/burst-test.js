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
        'User-Agent': 'intervu-burst-tester'
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
  if (!arr.length) return { min: 0, max: 0, p50: 0, p95: 0, p99: 0, mean: 0 };
  const sorted = [...arr].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)]
  };
}

async function runBurst() {
  console.log("================================================================");
  console.log("  PHASE 7: REALISTIC BURST TEST — 100 SUBMISSIONS OVER 5-10s    ");
  console.log("================================================================");

  const N = 100;
  const burstDurationMs = 6000; // Spread arrival evenly over 6 seconds
  const delayStep = burstDurationMs / N; // ~60ms between request dispatches

  const maxQueueDepths = [];
  const queueMonitor = setInterval(() => {
    try {
      const qLen = parseInt(execSync('docker exec intervu-redis redis-cli llen resque:queue:1.13.1').toString().trim(), 10);
      maxQueueDepths.push(isNaN(qLen) ? 0 : qLen);
    } catch (e) {}
  }, 500);

  const burstStart = Date.now();
  const promises = [];

  for (let i = 0; i < N; i++) {
    // Stagger submission arrival
    const promise = (async () => {
      await new Promise(r => setTimeout(r, Math.round(i * delayStep)));
      return submitSync({ source_code: JAVA_CODE, language_id: 62 });
    })();
    promises.push(promise);
  }

  const results = await Promise.all(promises);
  clearInterval(queueMonitor);

  const totalTime = Date.now() - burstStart;
  const passed = results.filter(r => r.status?.id === 3).length;
  const failed = N - passed;

  const latencies = results.map(r => r.wallLatency);
  const stats = computeStats(latencies);
  const throughput = (N / (totalTime / 1000)).toFixed(2);
  const peakQueue = Math.max(...maxQueueDepths, 0);

  console.log("\n--- BURST TEST RESULTS ---");
  console.log(`Total Submissions      : ${N}`);
  console.log(`Passed (Status 3 AC)   : ${passed}/${N} (${((passed/N)*100).toFixed(1)}%)`);
  console.log(`Infrastructure Errors  : ${failed}`);
  console.log(`Total Completion Time  : ${(totalTime/1000).toFixed(2)}s (${totalTime}ms)`);
  console.log(`Throughput             : ${throughput} req/s`);
  console.log(`Peak Redis Queue Depth : ${peakQueue}`);
  console.log(`Latency p50            : ${stats.p50}ms`);
  console.log(`Latency p95            : ${stats.p95}ms`);
  console.log(`Latency p99            : ${stats.p99}ms`);
  console.log(`Latency Max            : ${stats.max}ms`);
  console.log(`Latency Min            : ${stats.min}ms`);
  console.log(`Latency Mean           : ${stats.mean}ms`);
  console.log("================================================================");
}

runBurst().catch(console.error);
