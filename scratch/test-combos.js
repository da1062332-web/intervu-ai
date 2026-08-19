async function testCombinations() {
  const tests = [
    { name: 'Plain POST', headers: { 'Content-Type': 'application/json' } },
    { name: 'With X-Auth-Token', headers: { 'Content-Type': 'application/json', 'X-Auth-Token': '' } },
    { name: 'With X-Auth-User', headers: { 'Content-Type': 'application/json', 'X-Auth-User': 'admin' } },
    { name: 'Base64 encoded payload', headers: { 'Content-Type': 'application/json' }, body: { source_code: Buffer.from('print(42)').toString('base64'), language_id: 71 } },
  ];

  for (const t of tests) {
    try {
      const payload = t.body || { source_code: 'print(42)', language_id: 71 };
      const res = await fetch('https://server-production-4e4e.up.railway.app/submissions?base64_encoded=false&wait=true', {
        method: 'POST',
        headers: t.headers,
        body: JSON.stringify(payload)
      });
      console.log([] Status:, res.status, 'Body:', (await res.text()).substring(0, 100));
    } catch (e) {
      console.log([] Fetch error:, e.message);
    }
  }
}
testCombinations();
