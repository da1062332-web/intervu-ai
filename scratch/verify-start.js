async function startCandidate(name) {
  const email = `verify-${name}-${Date.now()}@intervu-test.ai`;
  const signupRes = await fetch("https://skillitrix.onrender.com/api/v1/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Password123!", fullName: `Verify ${name}`, referralCode: "QLO" })
  });
  const signupJson = await signupRes.json();
  const token = signupJson?.data?.accessToken || signupJson?.accessToken;

  const t0 = Date.now();
  const startRes = await fetch("https://skillitrix.onrender.com/api/v1/tests/start", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({ testConfigId: "cmsifafam000099s9csfe33pg" })
  });
  const dur = Date.now() - t0;
  const startJson = await startRes.json();
  console.log(`[${name}] Status: ${startRes.status} | Start Duration: ${dur}ms | Instance: ${startJson?.data?.testInstanceId}`);
}

async function test() {
  await startCandidate("Candidate-Warm-1");
  await startCandidate("Candidate-Warm-2");
}

test().catch(console.error);
