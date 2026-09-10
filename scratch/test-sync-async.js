const http = require('http');

function test(wait) {
  return new Promise((resolve) => {
    const start = Date.now();
    const data = JSON.stringify({
      source_code: Buffer.from('public class Main { public static void main(String[] args) { System.out.println("test"); } }').toString('base64'),
      language_id: 62
    });
    const req = http.request('http://localhost:2358/submissions?base64_encoded=true' + (wait ? '&wait=true' : ''), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        const ms = Date.now() - start;
        console.log(`[wait=${wait}] HTTP ${res.statusCode} took ${ms}ms -> body: ${body.trim().substring(0, 120)}`);
        resolve({ wait, ms, body: JSON.parse(body) });
      });
    });
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log("Testing POST /submissions without wait=true (Async Resque mode)...");
  const asyncRes = await test(false);

  console.log("\nTesting POST /submissions with wait=true (Sync Puma mode)...");
  const syncRes = await test(true);
}

run().catch(console.error);
