async function testAsync() {
  try {
    const res = await fetch('https://server-production-4e4e.up.railway.app/submissions?base64_encoded=false', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_code: 'print(42)', language_id: 71 })
    });
    console.log('Async Submission Status:', res.status);
    const body = await res.text();
    console.log('Body:', body);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
testAsync();
