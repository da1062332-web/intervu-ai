async function test() {
  try {
    const res = await fetch('https://server-production-4e4e.up.railway.app/submissions?wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_code: 'print(42)', language_id: 71 })
    });
    console.log('Status:', res.status);
    const body = await res.text();
    console.log('Body:', body);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
