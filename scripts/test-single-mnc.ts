const API_BASE = 'https://skillitrix.onrender.com/api/v1';

async function testSingleSignup() {
  const ts = Date.now();
  const email = `test_mnc_${ts}@example.com`;
  const password = 'Password123!';
  const fullName = `MNC Test Candidate ${ts}`;

  console.log(`Testing signup for ${email} with referralCode: MNC2026...`);
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      fullName,
      referralCode: 'MNC2026'
    })
  });

  const status = res.status;
  const data = await res.json();
  console.log(`Signup Status: ${status}`);
  console.log('Signup Response:', JSON.stringify(data, null, 2));

  if (!data.accessToken) {
    console.error('No accessToken returned');
    return;
  }

  // Wait 1 second for async referral redemption
  await new Promise(r => setTimeout(r, 1000));

  // Check referral status
  console.log('\nChecking GET /candidate/referrals/status...');
  const refStatusRes = await fetch(`${API_BASE}/candidate/referrals/status`, {
    headers: { 'Authorization': `Bearer ${data.accessToken}` }
  });
  console.log(`Referral Status Response [${refStatusRes.status}]:`, await refStatusRes.json());

  // Check candidate dashboard
  console.log('\nChecking GET /candidate/dashboard...');
  const dashRes = await fetch(`${API_BASE}/candidate/dashboard`, {
    headers: { 'Authorization': `Bearer ${data.accessToken}` }
  });
  console.log(`Dashboard Status Response [${dashRes.status}]:`, await dashRes.json());
}

testSingleSignup().catch(console.error);
