const http = require('http');

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
    const parsedUrl = new URL(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true&fields=*`);
    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'intervu-post-opt-bench'
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

async function runLevel(n) {
  console.log(`\n================================================================`);
  console.log(`>>> POST-OPTIMIZATION: Running Concurrency N = ${n}...`);
  console.log(`================================================================`);
  const batchStart = Date.now();
  const promises = [];
  for (let i = 0; i < n; i++) {
    promises.push(submitSync({ source_code: JAVA_CODE, language_id: 62 }));
  }
  const results = await Promise.all(promises);
  const totalElapsed = Date.now() - batchStart;
  const passed = results.filter(r => r.status?.id === 3).length;

  const wallTimes = results.map(r => r.wallLatency);
  const wallStats = computeStats(wallTimes);

  const execTimes = results.map(r => parseFloat(r.time || 0) * 1000);
  const execStats = computeStats(execTimes);

  const serverLifetimes = results.map(r => {
    if (!r.created_at || !r.finished_at) return 0;
    const c = new Date(r.created_at).getTime();
    const f = new Date(r.finished_at).getTime();
    return Math.max(0, f - c);
  });
  const serverLifeStats = computeStats(serverLifetimes);

  const queueTimes = serverLifetimes.map(sl => Math.max(0, sl - 1200));
  const queueStats = computeStats(queueTimes);

  const clientOverheadTimes = results.map((r, i) => Math.max(0, r.wallLatency - serverLifetimes[i]));
  const clientOverheadStats = computeStats(clientOverheadTimes);

  console.log(`Results: ${passed}/${n} Passed (${((passed/n)*100).toFixed(1)}%) | Batch Wall Time: ${totalElapsed}ms | Throughput: ${(n / (totalElapsed / 1000)).toFixed(2)} req/s`);
  console.log(`End-to-End Latency: min=${wallStats.min}ms, p50=${wallStats.p50}ms, p95=${wallStats.p95}ms, max=${wallStats.max}ms, mean=${wallStats.mean}ms`);
  console.log(`Program Execution : avg=${execStats.mean}ms, p50=${execStats.p50}ms, max=${execStats.max}ms`);
  console.log(`Server Lifetime   : p50=${serverLifeStats.p50}ms, p95=${serverLifeStats.p95}ms, max=${serverLifeStats.max}ms`);
  console.log(`Estimated Queue   : p50=${queueStats.p50}ms, p95=${queueStats.p95}ms, max=${queueStats.max}ms`);
  console.log(`Puma/Socket Delay : p50=${clientOverheadStats.p50}ms, p95=${clientOverheadStats.p95}ms, max=${clientOverheadStats.max}ms`);

  return {
    n,
    passed,
    totalElapsed,
    throughput: (n / (totalElapsed / 1000)).toFixed(2),
    wallStats,
    execStats,
    serverLifeStats,
    queueStats,
    clientOverheadStats
  };
}

async function main() {
  console.log("================================================================");
  console.log("    POST-OPTIMIZATION BENCHMARK ACROSS CONCURRENCY LEVELS       ");
  console.log("================================================================");
  const levels = [1, 5, 10, 25, 50, 75, 100];
  const summary = [];
  for (const n of levels) {
    const res = await runLevel(n);
    summary.push(res);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("\n================================================================");
  console.log("             POST-OPTIMIZATION SUMMARY TABLE                    ");
  console.log("================================================================");
  console.log("| N   | Success | Total (s) | Throughput | p50 (ms) | p95 (ms) | max (ms) | Queue p95 | Exec avg | Puma Delay |");
  console.log("|-----|---------|-----------|------------|----------|----------|----------|-----------|----------|------------|");
  for (const s of summary) {
    console.log(`| ${String(s.n).padEnd(3)} | ${String(s.passed + '/' + s.n).padEnd(7)} | ${String((s.totalElapsed/1000).toFixed(2)).padEnd(9)} | ${String(s.throughput + ' req/s').padEnd(10)} | ${String(s.wallStats.p50).padEnd(8)} | ${String(s.wallStats.p95).padEnd(8)} | ${String(s.wallStats.max).padEnd(8)} | ${String(s.queueStats.p95 + 'ms').padEnd(9)} | ${String(s.execStats.mean + 'ms').padEnd(8)} | ${String(s.clientOverheadStats.p50 + 'ms').padEnd(10)} |`);
  }
}

main().catch(console.error);
