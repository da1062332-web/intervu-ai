const http = require('http');
const { execSync } = require('child_process');

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

function submitWait(payload) {
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
        'User-Agent': 'intervu-profiler'
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

function submitAsync(payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const postStart = Date.now();
    const parsedUrl = new URL(`${JUDGE0_URL}/submissions?base64_encoded=true`);
    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'intervu-profiler'
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', async () => {
        const postLatency = Date.now() - postStart;
        try {
          const created = JSON.parse(body);
          const token = created.token;
          if (!token) {
            resolve({ httpStatus: res.statusCode, postLatency, wallLatency: postLatency, error: 'No token returned' });
            return;
          }
          // Now poll until completed
          const pollStart = Date.now();
          let pollCount = 0;
          let pollData = null;
          while (pollCount < 60) {
            pollCount++;
            await new Promise(r => setTimeout(r, 250)); // 250ms poll
            const check = await pollToken(token);
            if (check && check.status && check.status.id > 2) {
              pollData = check;
              break;
            }
          }
          const totalLatency = Date.now() - postStart;
          const pollTime = Date.now() - pollStart;
          resolve({
            httpStatus: res.statusCode,
            token,
            postLatency,
            pollTime,
            pollCount,
            wallLatency: totalLatency,
            ...pollData
          });
        } catch (e) {
          resolve({ httpStatus: res.statusCode, postLatency, wallLatency: postLatency, error: e.message });
        }
      });
    });
    req.on('error', (err) => resolve({ httpStatus: 0, postLatency: Date.now() - postStart, wallLatency: Date.now() - postStart, error: err.message }));
    req.write(data);
    req.end();
  });
}

function pollToken(token) {
  return new Promise((resolve) => {
    const req = http.get(`${JUDGE0_URL}/submissions/${token}?base64_encoded=true`, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
  });
}

function b64(str) { return Buffer.from(str).toString('base64'); }

const JAVA_CODE = b64(`public class Main {
    public static void main(String[] args) {
        int sum = 0;
        for (int i = 0; i < 50000; i++) sum += (i % 7);
        System.out.println("Java OK: " + sum);
    }
}`);

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

async function profileBatch(name, count, runner) {
  console.log(`\n================================================================`);
  console.log(`Profiling [${name}] with Concurrency N = ${count}...`);
  console.log(`================================================================`);
  const batchStart = Date.now();
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(runner({ source_code: JAVA_CODE, language_id: 62 }));
  }
  const results = await Promise.all(promises);
  const totalElapsed = Date.now() - batchStart;
  const accepted = results.filter(r => r.status?.id === 3).length;
  const latencies = results.map(r => r.wallLatency);
  const latStats = computeStats(latencies);
  const execTimes = results.map(r => parseFloat(r.time || 0) * 1000);
  const execStats = computeStats(execTimes);

  console.log(`Summary: ${accepted}/${count} Passed | Total Time: ${totalElapsed}ms | Throughput: ${(count / (totalElapsed / 1000)).toFixed(2)} req/s`);
  console.log(`Wall Latencies : min=${latStats.min}ms, p50=${latStats.p50}ms, p95=${latStats.p95}ms, max=${latStats.max}ms, mean=${latStats.mean}ms`);
  console.log(`Execution Time : avg=${execStats.mean}ms, max=${execStats.max}ms`);

  if (results[0].postLatency !== undefined) {
    const postStats = computeStats(results.map(r => r.postLatency));
    const pollStats = computeStats(results.map(r => r.pollTime));
    const pollCountStats = computeStats(results.map(r => r.pollCount));
    console.log(`POST Enqueue   : p50=${postStats.p50}ms, p95=${postStats.p95}ms, max=${postStats.max}ms`);
    console.log(`Polling Wait   : p50=${pollStats.p50}ms, p95=${pollStats.p95}ms, max=${pollStats.max}ms (avg polls: ${pollCountStats.mean})`);
  }

  return {
    mode: name,
    count,
    totalElapsed,
    throughput: (count / (totalElapsed / 1000)).toFixed(2),
    successRate: `${((accepted / count) * 100).toFixed(1)}%`,
    latStats,
    execStats
  };
}

async function run() {
  console.log(">>> COMPARATIVE PROFILING: SYNC (wait=true) VS ASYNC QUEUE (Resque workers) <<<\n");

  // Profile levels with current sync mode
  console.log("--- PART A: Current Sync Mode (wait=true on Puma) ---");
  for (const n of [1, 5, 10, 25, 50, 75, 100]) {
    await profileBatch("Sync Mode (wait=true)", n, submitWait);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("\n--- PART B: Async Resque Queue Mode (wait=false with Polling) ---");
  for (const n of [1, 5, 10, 25, 50, 75, 100]) {
    await profileBatch("Async Queue (Resque)", n, submitAsync);
    await new Promise(r => setTimeout(r, 2000));
  }
}

run().catch(console.error);
