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
        'User-Agent': 'intervu-worker-bench'
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

async function runWorkerCount(workerCount, n = 50) {
  console.log(`\n================================================================`);
  console.log(`Configuring COUNT = ${workerCount} Resque workers...`);
  console.log(`================================================================`);

  // Update judge0.conf COUNT line
  const confPath = 'infrastructure/docker/judge0/judge0-master/judge0.conf';
  const fs = require('fs');
  let conf = fs.readFileSync(confPath, 'utf8');
  conf = conf.replace(/^COUNT=.*$/m, `COUNT=${workerCount}`);
  fs.writeFileSync(confPath, conf, 'utf8');

  // Restart judge0-worker container
  execSync('docker restart judge0-worker');
  // Wait for worker to register
  await new Promise(r => setTimeout(r, 4000));

  // Prune stale workers in Redis
  try {
    execSync('docker exec intervu-redis sh -c "for w in $(redis-cli smembers resque:workers); do case $w in *$(docker exec judge0-worker hostname)*) ;; *) redis-cli srem resque:workers \\"$w\\" ;; esac; done"');
  } catch (e) {}

  const activeCount = execSync('docker exec intervu-redis redis-cli scard resque:workers').toString().trim();
  console.log(`Confirmed active workers in Redis: ${activeCount}`);

  // Warmup 1 request
  await submitSync({ source_code: JAVA_CODE, language_id: 62 });
  await new Promise(r => setTimeout(r, 1000));

  console.log(`Running benchmark with N = ${n} concurrent submissions...`);
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

  const throughput = (n / (totalElapsed / 1000)).toFixed(2);
  console.log(`COUNT=${workerCount} Results: ${passed}/${n} Passed | Total Time: ${totalElapsed}ms | Throughput: ${throughput} req/s`);
  console.log(`Latency stats: min=${wallStats.min}ms, p50=${wallStats.p50}ms, p95=${wallStats.p95}ms, max=${wallStats.max}ms`);

  return {
    workerCount,
    passed,
    n,
    totalElapsed,
    throughput,
    wallStats
  };
}

async function main() {
  const workerCounts = [8, 12, 16, 24, 32, 48];
  const summary = [];

  for (const count of workerCounts) {
    const res = await runWorkerCount(count, 50);
    summary.push(res);
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log("\n================================================================");
  console.log("            WORKER CONCURRENCY OPTIMIZATION BENCHMARK           ");
  console.log("================================================================");
  console.log("| Workers | N   | Success | Total Time (s) | Throughput | p50 (ms) | p95 (ms) | Max (ms) |");
  console.log("|---------|-----|---------|----------------|------------|----------|----------|----------|");
  for (const s of summary) {
    console.log(`| ${String(s.workerCount).padEnd(7)} | ${String(s.n).padEnd(3)} | ${String(s.passed + '/' + s.n).padEnd(7)} | ${String((s.totalElapsed/1000).toFixed(2)).padEnd(14)} | ${String(s.throughput + ' req/s').padEnd(10)} | ${String(s.wallStats.p50).padEnd(8)} | ${String(s.wallStats.p95).padEnd(8)} | ${String(s.wallStats.max).padEnd(8)} |`);
  }
}

main().catch(console.error);
