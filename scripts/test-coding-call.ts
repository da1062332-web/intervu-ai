const API_BASE = 'https://skillitrix.onrender.com/api/v1';

async function testCodingRun() {
  // 1. Sign up a test user
  const ts = Date.now();
  const signupRes = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test_code_${ts}@example.com`,
      password: 'Password123!',
      fullName: 'Test Code User',
      referralCode: 'QLO'
    })
  });
  const signupData = await signupRes.json();
  console.log('Signup status:', signupRes.status);
  const token = signupData.data?.accessToken || signupData.accessToken;
  console.log('Token exists:', Boolean(token));

  // 2. Start test
  const startRes = await fetch(`${API_BASE}/tests/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ testConfigId: 'cmsifafam000099s9csfe33pg' })
  });
  const startData = await startRes.json();
  console.log('Start test status:', startRes.status);
  const testInstanceId = startData.data?.testInstanceId || startData.testInstanceId;
  console.log('TestInstanceId:', testInstanceId);

  // 3. Load snapshot to get coding question
  const snapRes = await fetch(`${API_BASE}/tests/${testInstanceId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const snapData = await snapRes.json();
  const sections = snapData.data?.sections || [];
  let codingQ = null;
  for (const s of sections) {
    for (const q of (s.questions || [])) {
      if ((s.sectionName || '').toLowerCase().includes('coding') || q.type === 'CODING' || q.questionType === 'CODING') {
        codingQ = q;
        break;
      }
    }
  }
  console.log('Found coding question:', codingQ?.questionId || codingQ?.id);

  // 4. Call /coding/run
  const runPayload = {
    questionId: codingQ?.questionId || codingQ?.id,
    testInstanceId,
    code: 'def solution(numbers):\n    return sum(1 for x in numbers if x % 2 == 0)\n',
    language: 'python'
  };
  console.log('Calling POST /coding/run with payload:', runPayload);
  const runRes = await fetch(`${API_BASE}/coding/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(runPayload)
  });
  console.log('Run response status:', runRes.status);
  const runData = await runRes.json();
  console.log('Run response body:', JSON.stringify(runData, null, 2));
}

testCodingRun().catch(console.error);
