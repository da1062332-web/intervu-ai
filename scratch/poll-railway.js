async function testWithPoll() {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch('https://server-production-4e4e.up.railway.app/submissions?wait=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: 'print(42)', language_id: 71 })
      });
      const body = await res.text();
      console.log('Attempt', i + 1, '- Status:', res.status, '- Body:', body);
      if (res.status === 200 || res.status === 201) break;
    } catch (e) {
      console.log('Attempt', i + 1, '- Error:', e.message);
    }
    await new Promise(r => setTimeout(r, 4000));
  }
}
testWithPoll();
