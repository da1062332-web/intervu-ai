import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import {
  BASE_URL,
  SIGNUP_PASSWORD,
  TEST_RUN_ID,
  getHeaders,
} from "./common.js";

const TOTAL_CANDIDATES = Number(__ENV.TOTAL_CANDIDATES) || 10;
const REFERRAL_CODE = __ENV.REFERRAL_CODE || "MNC2026";
const TARGET_ASSESSMENT_ID = __ENV.ASSESSMENT_ID || "cms5x7a3q0044139ug61gcjh6"; // TCS NQT Placement Assessment

// Custom Metrics
const candidatesAttempted = new Counter("mnc_candidates_attempted");
const candidatesSuccess = new Counter("mnc_candidates_success");
const candidatesFailed = new Counter("mnc_candidates_failed");
const signupSuccess = new Counter("mnc_signup_success");
const loginSuccess = new Counter("mnc_login_success");
const authMeSuccess = new Counter("mnc_auth_me_success");
const refStatusSuccess = new Counter("mnc_ref_status_success");
const dashboardSuccess = new Counter("mnc_dashboard_success");
const startTestSuccess = new Counter("mnc_start_test_success");

const errors429 = new Counter("mnc_errors_429");
const errors4xx = new Counter("mnc_errors_4xx");
const errors5xx = new Counter("mnc_errors_5xx");
const netTimeouts = new Counter("mnc_timeouts");
const appErrorRate = new Rate("mnc_error_rate");

const signupDuration = new Trend("mnc_signup_duration_ms");
const loginDuration = new Trend("mnc_login_duration_ms");
const meDuration = new Trend("mnc_me_duration_ms");
const refStatusDuration = new Trend("mnc_ref_status_duration_ms");
const dashboardDuration = new Trend("mnc_dashboard_duration_ms");
const startTestDuration = new Trend("mnc_start_test_duration_ms");

export const options = {
  scenarios: {
    mnc_candidates_signup: {
      executor: "per-vu-iterations",
      vus: TOTAL_CANDIDATES,
      iterations: 1,
      maxDuration: "3m",
    },
  },
  thresholds: {
    mnc_error_rate: ["rate<0.05"],
    mnc_signup_duration_ms: ["p(95)<5000"],
    mnc_login_duration_ms: ["p(95)<3000"],
    mnc_me_duration_ms: ["p(95)<2000"],
    mnc_candidates_success: [`count>=${TOTAL_CANDIDATES}`],
  },
};

function trackStatus(res, endpoint) {
  const status = res.status;
  const isErr = status === 0 || status >= 400;
  appErrorRate.add(isErr ? 1 : 0);

  if (status === 0) {
    errors5xx.add(1);
    netTimeouts.add(1);
  } else if (status === 429) {
    errors429.add(1);
    errors4xx.add(1);
  } else if (status >= 400 && status < 500) {
    errors4xx.add(1);
  } else if (status >= 500) {
    errors5xx.add(1);
  }
}

export default function () {
  const vuId = __VU;
  candidatesAttempted.add(1);

  // Stagger candidate requests slightly (0-2s) to model realistic traffic
  const jitterSec = ((vuId - 1) % 5) * 0.4;
  if (jitterSec > 0) {
    sleep(jitterSec);
  }

  const candidateEmail = `qloax-mnc2026-c${vuId}-${Date.now().toString(36)}@skillitrix-loadtest.invalid`;
  const candidateName = `MNC2026 Candidate ${vuId}`;
  let failed = false;

  console.log(`[Candidate ${vuId}] Signing up with coupon code ${REFERRAL_CODE}: ${candidateEmail}`);

  // 1. Candidate Registration with Coupon Code
  const tSignup0 = Date.now();
  let signupRes = http.post(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: candidateName,
      referralCode: REFERRAL_CODE,
    }),
    { headers: getHeaders(), tags: { endpoint: "signup" }, timeout: "60s" }
  );

  // Transient retry on Render proxy drop
  if (signupRes.status === 0) {
    sleep(0.5);
    signupRes = http.post(
      `${BASE_URL}/auth/signup`,
      JSON.stringify({
        email: candidateEmail,
        password: SIGNUP_PASSWORD,
        fullName: candidateName,
        referralCode: REFERRAL_CODE,
      }),
      { headers: getHeaders(), tags: { endpoint: "signup" }, timeout: "60s" }
    );
  }

  const signupDur = Date.now() - tSignup0;
  signupDuration.add(signupDur);
  trackStatus(signupRes, "signup");

  const signupOk = check(signupRes, {
    "Signup returns 201": (r) => r.status === 201 || r.status === 200,
  });

  if (!signupOk) {
    console.error(`[Candidate ${vuId}] Signup failed: status ${signupRes.status} body: ${signupRes.body?.slice(0, 150)}`);
    candidatesFailed.add(1);
    return;
  }
  signupSuccess.add(1);

  let accessToken = null;
  let refreshToken = null;
  try {
    accessToken = signupRes.json("data.accessToken") || signupRes.json("accessToken");
    refreshToken = signupRes.json("data.refreshToken") || signupRes.json("refreshToken");
  } catch (_) {}

  // 2. Candidate Login Flow & Session Verification
  const tLogin0 = Date.now();
  let loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: candidateEmail, password: SIGNUP_PASSWORD }),
    { headers: getHeaders(), tags: { endpoint: "login" }, timeout: "60s" }
  );
  const loginDur = Date.now() - tLogin0;
  loginDuration.add(loginDur);
  trackStatus(loginRes, "login");

  const loginOk = check(loginRes, {
    "Login returns 200/201": (r) => r.status === 200 || r.status === 201,
  });

  if (!loginOk) {
    console.error(`[Candidate ${vuId}] Login failed: status ${loginRes.status}`);
    candidatesFailed.add(1);
    return;
  }
  loginSuccess.add(1);

  try {
    const loginToken = loginRes.json("data.accessToken") || loginRes.json("accessToken");
    if (loginToken) accessToken = loginToken;
  } catch (_) {}

  const authHeaders = getHeaders(accessToken);

  // 3. Authenticated Profile Verification (/auth/me)
  const tMe0 = Date.now();
  const meRes = http.get(`${BASE_URL}/auth/me`, {
    headers: authHeaders,
    tags: { endpoint: "auth_me" },
    timeout: "30s",
  });
  const meDur = Date.now() - tMe0;
  meDuration.add(meDur);
  trackStatus(meRes, "auth_me");

  const meOk = check(meRes, {
    "GET /auth/me returns 200": (r) => r.status === 200,
    "Candidate role verified": (r) => {
      try {
        const body = r.json();
        const role = body.data?.role || body.role;
        return role === "CANDIDATE";
      } catch (_) {
        return false;
      }
    },
  });

  if (meOk) authMeSuccess.add(1);

  // Allow async referral redemption to complete (0.5s pause)
  sleep(0.5);

  // 4. Referral / Coupon Status Check
  const tRef0 = Date.now();
  const refStatusRes = http.get(`${BASE_URL}/candidate/referrals/status`, {
    headers: authHeaders,
    tags: { endpoint: "referral_status" },
    timeout: "30s",
  });
  const refDur = Date.now() - tRef0;
  refStatusDuration.add(refDur);
  trackStatus(refStatusRes, "referral_status");

  const refOk = check(refStatusRes, {
    "Referral status returns 200": (r) => r.status === 200,
  });
  if (refOk) refStatusSuccess.add(1);

  // 5. Candidate Dashboard Check (Verifying assessment entitlement)
  const tDash0 = Date.now();
  const dashRes = http.get(`${BASE_URL}/candidate/dashboard`, {
    headers: authHeaders,
    tags: { endpoint: "dashboard" },
    timeout: "30s",
  });
  const dashDur = Date.now() - tDash0;
  dashboardDuration.add(dashDur);
  trackStatus(dashRes, "dashboard");

  const dashOk = check(dashRes, {
    "Dashboard returns 200": (r) => r.status === 200,
  });
  if (dashOk) dashboardSuccess.add(1);

  // 6. Test Start / Access Check
  const tStart0 = Date.now();
  let startRes = http.post(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: TARGET_ASSESSMENT_ID }),
    { headers: authHeaders, tags: { endpoint: "start_test" }, timeout: "60s" }
  );

  if (startRes.status === 0) {
    sleep(0.5);
    startRes = http.post(
      `${BASE_URL}/tests/start`,
      JSON.stringify({ testConfigId: TARGET_ASSESSMENT_ID }),
      { headers: authHeaders, tags: { endpoint: "start_test" }, timeout: "60s" }
    );
  }

  const startDur = Date.now() - tStart0;
  startTestDuration.add(startDur);
  trackStatus(startRes, "start_test");

  let testInstanceId = null;
  try {
    testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  } catch (_) {}

  const startOk = check(startRes, {
    "Start test returns 200/201": (r) => r.status === 200 || r.status === 201,
    "Test instance ID received": () => Boolean(testInstanceId),
  });

  if (startOk) {
    startTestSuccess.add(1);
    console.log(`[Candidate ${vuId}] Successfully unlocked & started test! Instance: ${testInstanceId}`);
  } else {
    console.warn(`[Candidate ${vuId}] Start test returned ${startRes.status}: ${startRes.body?.slice(0, 150)}`);
  }

  candidatesSuccess.add(1);
}

export function handleSummary(data) {
  const getMetricVal = (name, field = "value") => {
    if (data.metrics[name] && data.metrics[name].values) {
      return data.metrics[name].values[field] ?? 0;
    }
    return 0;
  };

  const getLatency = (name) => {
    const m = data.metrics[name];
    if (!m || !m.values) return { avg: "0ms", med: "0ms", p95: "0ms", p99: "0ms", max: "0ms" };
    const v = m.values;
    const toMs = (n) => `${Math.round(n || 0)}ms`;
    return {
      avg: toMs(v.avg),
      med: toMs(v.med),
      p95: toMs(v["p(95)"]),
      p99: toMs(v["p(99)"]),
      max: toMs(v.max),
    };
  };

  const candAttempted = getMetricVal("mnc_candidates_attempted", "count");
  const candSuccess = getMetricVal("mnc_candidates_success", "count");
  const candFailed = getMetricVal("mnc_candidates_failed", "count");
  const err429 = getMetricVal("mnc_errors_429", "count");
  const err4xx = getMetricVal("mnc_errors_4xx", "count");
  const err5xx = getMetricVal("mnc_errors_5xx", "count");
  const timeouts = getMetricVal("mnc_timeouts", "count");
  const errorRate = (getMetricVal("mnc_error_rate", "rate") * 100).toFixed(2);

  const signupLat = getLatency("mnc_signup_duration_ms");
  const loginLat = getLatency("mnc_login_duration_ms");
  const startLat = getLatency("mnc_start_test_duration_ms");

  const report = `# 10 Candidates MNC2026 Coupon Load Test Execution Report

**Execution Target:** SkillitriX Live Render Backend (\`https://skillitrix.onrender.com/api/v1\`)  
**Coupon Code:** \`${REFERRAL_CODE}\` (Unlocks: TCS NQT Placement Assessment)  
**Total Candidates:** ${candAttempted}  

---

### Core Performance Metrics

| Metric | Attempted | Successful | Failed | Error % | 429 | 4xx | 5xx | Timeouts | p50 | p95 | Max |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Candidate Signup & Flow** | ${candAttempted} | ${candSuccess} | ${candFailed} | ${errorRate}% | ${err429} | ${err4xx} | ${err5xx} | ${timeouts} | ${signupLat.med} | ${signupLat.p95} | ${signupLat.max} |

### Endpoint Breakdown
- **Signups Successful:** ${getMetricVal("mnc_signup_success", "count")} / ${candAttempted}
- **Logins Successful:** ${getMetricVal("mnc_login_success", "count")} / ${candAttempted}
- **Auth /me Verifications:** ${getMetricVal("mnc_auth_me_success", "count")} / ${candAttempted}
- **Referral Status Queries:** ${getMetricVal("mnc_ref_status_success", "count")} / ${candAttempted}
- **Dashboard Entitlements:** ${getMetricVal("mnc_dashboard_success", "count")} / ${candAttempted}
- **Assessments Started:** ${getMetricVal("mnc_start_test_success", "count")} / ${candAttempted}

### Latency Profiles
- **Signup:** p50=${signupLat.med}, p95=${signupLat.p95}, max=${signupLat.max}
- **Login:** p50=${loginLat.med}, p95=${loginLat.p95}, max=${loginLat.max}
- **Assessment Start:** p50=${startLat.med}, p95=${startLat.p95}, max=${startLat.max}
`;

  return {
    stdout: `\n${report}\n`,
    "load-tests/reports/qloax-10-candidates-mnc2026-report.md": report,
  };
}
