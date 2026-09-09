const http = require('http');

const payload = JSON.stringify({
  source_code: Buffer.from('public class Main { public static void main(String[] a){ System.out.println("Latency test OK"); }}').toString('base64'),
  language_id: 62
});

const start = Date.now();
const req = http.request({
  hostname: 'localhost',
  port: 2358,
  path: '/submissions?base64_encoded=true&wait=true',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const elapsed = Date.now() - start;
    const json = JSON.parse(d);
    console.log('Status:', json.status);
    console.log('Stdout:', Buffer.from(json.stdout || '', 'base64').toString().trim());
    console.log('Total Elapsed Wall Time:', elapsed + 'ms');
    console.log('CPU Time:', json.time, 'Memory:', json.memory);
  });
});
req.write(payload);
req.end();
