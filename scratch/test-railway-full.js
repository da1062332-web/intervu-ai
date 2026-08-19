async function runTest() {
  console.log('--- Testing Synchronous Submission ---');
  try {
    const res = await fetch('https://server-production-4e4e.up.railway.app/submissions?base64_encoded=false&wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: 'print(42)',
        language_id: 71,
        stdin: ''
      })
    });
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
  } catch (err) {
    console.error('Sync Error:', err.message);
  }

  console.log('\n--- Testing Async Submission ---');
  try {
    const res2 = await fetch('https://server-production-4e4e.up.railway.app/submissions?base64_encoded=false', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: 'print(42)',
        language_id: 71,
        stdin: ''
      })
    });
    console.log('Async Status:', res2.status);
    console.log('Async Body:', await res2.text());
  } catch (err) {
    console.error('Async Error:', err.message);
  }
}
runTest();
