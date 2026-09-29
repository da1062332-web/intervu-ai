import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import {
  BASE_URL,
  REFERRAL_CODE,
  SIGNUP_PASSWORD,
  TEST_RUN_ID,
  getHeaders,
  generateCandidateEmail,
} from "./common.js";

const MAX_VUS = Number(__ENV.MAX_VUS) || Number(__ENV.VUS) || 500;
const RAMP_WINDOW_SEC = Number(__ENV.RAMP_WINDOW_SEC) || 60;

// Metrics
const candidatesAttempted = new Counter("day1_auth_candidates_attempted");
const candidatesSuccess = new Counter("day1_auth_candidates_success");
const candidatesFailed = new Counter("day1_auth_candidates_failed");
const loginSuccess = new Counter("day1_auth_login_success");
const refreshSuccess = new Counter("day1_auth_refresh_success");
const authMeSuccess = new Counter("day1_auth_me_success");
const probe401Success = new Counter("day1_auth_probe401_success");
const probe403Success = new Counter("day1_auth_probe403_success");

const errors429 = new Counter("day1_auth_errors_429");
const errors4xx = new Counter("day1_auth_errors_4xx");
const errors5xx = new Counter("day1_auth_errors_5xx");
const netTimeouts = new Counter("day1_auth_timeouts");
const netResets = new Counter("day1_auth_resets");
const netEof = new Counter("day1_auth_eof");
const appErrorRate = new Rate("day1_auth_error_rate");

const loginDuration = new Trend("day1_auth_login_duration_ms");
const meDuration = new Trend("day1_auth_me_duration_ms");
const refreshDuration = new Trend("day1_auth_refresh_duration_ms");
const totalAuthDuration = new Trend("day1_auth_total_duration_ms");

export const options = {
  scenarios: {
    day1_auth_session: {
      executor: "per-vu-iterations",
      vus: MAX_VUS,
      iterations: 1,
      maxDuration: "10m",
    },
  },
  thresholds: {
    day1_auth_error_rate: ["rate<0.05"],
    day1_auth_login_duration_ms: ["p(95)<5000"],
    day1_auth_me_duration_ms: ["p(95)<2500"],
    day1_auth_refresh_duration_ms: ["p(95)<3000"],
    day1_auth_candidates_success: [`count>=${MAX_VUS}`],
  },
};

function trackStatus(res, endpoint, isDeliberateError = false) {
  const status = res.status;
  if (isDeliberateError) {
    return; // Do not count intentional 401/403 probes as errors
  }

  const isErr = status === 0 || status >= 400;
  appErrorRate.add(isErr ? 1 : 0);

  if (status === 0) {
    errors5xx.add(1);
    const errStr = String(res.error || "");
    if (errStr.includes("timeout") || errStr.includes("deadline")) {
      netTimeouts.add(1);
    } else if (errStr.includes("reset") || errStr.includes("forcibly closed")) {
      netResets.add(1);
    } else if (errStr.includes("EOF")) {
      netEof.add(1);
    }
    console.error(`[VU ${__VU}] [NET ERROR status 0] on ${endpoint}: ${errStr}`);
  } else if (status === 429) {
    errors429.add(1);
    errors4xx.add(1);
  } else if (status >= 400 && status < 500) {
    errors4xx.add(1);
  } else if (status >= 500) {
    errors5xx.add(1);
  }
}

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[DAY 1 - TEST 2: AUTHENTICATION & SESSION TEST]`);
  console.log(`Target Base URL:       ${BASE_URL}`);
  console.log(`Referral Code:         ${REFERRAL_CODE}`);
  console.log(`Candidates (VUs):      ${MAX_VUS}`);
  console.log(`Arrival Ramp Window:   ${RAMP_WINDOW_SEC}s`);
  console.log(`======================================================\n`);
  return {};
}

export default function () {
  const vuId = __VU;
  candidatesAttempted.add(1);

  // Stagger arrival across ramp window
  const arrivalStaggerSec = MAX_VUS > 1 ? (vuId - 1) * (RAMP_WINDOW_SEC / MAX_VUS) : 0;
  if (arrivalStaggerSec > 0) {
    sleep(arrivalStaggerSec);
  }

  const candidateEmail = generateCandidateEmail(`auth-d1-vu${vuId}`, vuId);
  let failed = false;

  // 1. Initial Candidate Registration
  const signupRes = http.post(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `Auth Candidate VU${vuId}`,
      referralCode: REFERRAL_CODE,
    }),
    { headers: getHeaders(), tags: { endpoint: "auth_signup" }, timeout: "60s" }
  );
  trackStatus(signupRes, "signup");

  if (signupRes.status !== 200 && signupRes.status !== 201) {
    failed = true;
    candidatesFailed.add(1);
    console.error(`[VU ${vuId}] Signup failed: ${signupRes.status} ${signupRes.body?.slice(0, 150)}`);
    return;
  }

  // 2. Candidate Login Flow & Session Creation
  const tLogin0 = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: candidateEmail, password: SIGNUP_PASSWORD }),
    { headers: getHeaders(), tags: { endpoint: "auth_login" }, timeout: "60s" }
  );
  const loginTime = Date.now() - tLogin0;
  loginDuration.add(loginTime);
  totalAuthDuration.add(loginTime);
  trackStatus(loginRes, "login");

  let accessToken = null;
  let refreshToken = null;
  try {
    accessToken = loginRes.json("data.accessToken") || loginRes.json("accessToken");
    refreshToken = loginRes.json("data.refreshToken") || loginRes.json("refreshToken");
  } catch (_) {}

  const loginOk = check(loginRes, {
    "Login returns 200/201": (r) => r.status === 200 || r.status === 201,
    "Access token received": () => Boolean(accessToken),
    "Refresh token received": () => Boolean(refreshToken),
  });

  if (!loginOk || !accessToken) {
    failed = true;
    candidatesFailed.add(1);
    console.error(`[VU ${vuId}] Login failed: ${loginRes.status}`);
    return;
  }
  loginSuccess.add(1);

  let authHeaders = getHeaders(accessToken);

  // 3. JWT Authentication & Profile Validation (/auth/me)
  const tMe0 = Date.now();
  const meRes = http.get(`${BASE_URL}/auth/me`, {
    headers: authHeaders,
    tags: { endpoint: "auth_me" },
    timeout: "30s",
  });
  const meTime = Date.now() - tMe0;
  meDuration.add(meTime);
  totalAuthDuration.add(meTime);
  trackStatus(meRes, "auth_me");

  const meOk = check(meRes, {
    "GET /auth/me returns 200": (r) => r.status === 200,
    "Email matches candidate": (r) => {
      const email = r.json("data.email") || r.json("email");
      return email === candidateEmail;
    },
  });

  if (!meOk) {
    failed = true;
    candidatesFailed.add(1);
    return;
  }
  authMeSuccess.add(1);

  // 4. Token Refresh Lifecycle (POST /auth/refresh)
  if (refreshToken) {
    const tRef0 = Date.now();
    const refreshRes = http.post(
      `${BASE_URL}/auth/refresh`,
      JSON.stringify({ refreshToken }),
      { headers: getHeaders(), tags: { endpoint: "auth_refresh" }, timeout: "30s" }
    );
    const refTime = Date.now() - tRef0;
    refreshDuration.add(refTime);
    totalAuthDuration.add(refTime);
    trackStatus(refreshRes, "refresh");

    let newAccessToken = null;
    try {
      newAccessToken = refreshRes.json("data.accessToken") || refreshRes.json("accessToken");
    } catch (_) {}

    const refreshOk = check(refreshRes, {
      "POST /auth/refresh returns 200/201": (r) => r.status === 200 || r.status === 201,
      "New access token obtained": () => Boolean(newAccessToken),
    });

    if (refreshOk && newAccessToken) {
      refreshSuccess.add(1);
      accessToken = newAccessToken;
      authHeaders = getHeaders(accessToken);
    } else {
      console.warn(`[VU ${vuId}] Token refresh failed: ${refreshRes.status}`);
      failed = true;
    }
  }

  // 5. Expired/Corrupted Token Handling (401 Detection)
  const invalidHeaders = getHeaders("invalid_corrupted_expired_jwt_token");
  const probe401Res = http.get(`${BASE_URL}/auth/me`, {
    headers: invalidHeaders,
    tags: { endpoint: "probe_401" },
    timeout: "15s",
  });
  trackStatus(probe401Res, "probe_401", true);

  const is401 = check(probe401Res, {
    "Invalid token correctly rejected with 401": (r) => r.status === 401,
  });
  if (is401) {
    probe401Success.add(1);
  }

  // 6. Authorization Boundary Guard (403/404 cross-candidate access)
  const foreignAttemptId = "cmu_foreign_attempt_id_00000000";
  const crossRes = http.get(`${BASE_URL}/tests/${foreignAttemptId}`, {
    headers: authHeaders,
    tags: { endpoint: "probe_cross_access" },
    timeout: "15s",
  });
  trackStatus(crossRes, "probe_cross", true);

  const isCrossBlocked = check(crossRes, {
    "Cross-candidate access rejected with 403 or 404": (r) => r.status === 403 || r.status === 404,
  });
  if (isCrossBlocked) {
    probe403Success.add(1);
  }

  if (!failed) {
    candidatesSuccess.add(1);
  } else {
    candidatesFailed.add(1);
  }
}

export function handleSummary(data) {
  const getVal = (name) => data.metrics[name]?.values?.count ?? 0;
  const getLat = (name) => {
    const v = data.metrics[name]?.values;
    if (!v) return { med: "0ms", p90: "0ms", p95: "0ms", p99: "0ms", max: "0ms", avg: "0ms" };
    return {
      med: `${Math.round(v.med || 0)}ms`,
      p90: `${Math.round(v["p(90)"] || 0)}ms`,
      p95: `${Math.round(v["p(95)"] || 0)}ms`,
      p99: `${Math.round(v["p(99)"] || 0)}ms`,
      max: `${Math.round(v.max || 0)}ms`,
      avg: `${Math.round(v.avg || 0)}ms`,
    };
  };

  const attempted = getVal("day1_auth_candidates_attempted");
  const success = getVal("day1_auth_candidates_success");
  const failed = getVal("day1_auth_candidates_failed");
  const err429 = getVal("day1_auth_errors_429");
  const err4xx = getVal("day1_auth_errors_4xx");
  const err5xx = getVal("day1_auth_errors_5xx");
  const timeouts = getVal("day1_auth_timeouts");
  const resets = getVal("day1_auth_resets");
  const eof = getVal("day1_auth_eof");
  const errRate = ((data.metrics.day1_auth_error_rate?.values?.rate ?? 0) * 100).toFixed(2);

  const loginLat = getLat("day1_auth_login_duration_ms");
  const meLat = getLat("day1_auth_me_duration_ms");
  const refLat = getLat("day1_auth_refresh_duration_ms");
  const totalLat = getLat("day1_auth_total_duration_ms");

  const report = `
================================================================================
# Qloax Day 1 - Test 2: Authentication & Session Report
================================================================================
Generated:                  ${new Date().toISOString()}
Target Environment:         ${BASE_URL}
Candidates Attempted:       ${attempted}
Successful Candidates:      ${success}
Failed Candidates:          ${failed}
Error Rate:                 ${errRate}%

--------------------------------------------------------------------------------
## 1. HTTP Status & Error Breakdown
- HTTP 429 (Rate Limited):  ${err429}
- HTTP 4xx (Client Errors): ${err4xx}
- HTTP 5xx (Server Drops):  ${err5xx}
- Timeouts:                 ${timeouts}
- Connection Resets:        ${resets}
- Stream EOF:               ${eof}

--------------------------------------------------------------------------------
## 2. Authentication & Session Checks
- Login Success:            ${getVal("day1_auth_login_success")} / ${attempted}
- /auth/me Validation:      ${getVal("day1_auth_me_success")} / ${attempted}
- Refresh Token Rotation:   ${getVal("day1_auth_refresh_success")} / ${attempted}
- 401 Expiration Guard:     ${getVal("day1_auth_probe401_success")} / ${attempted}
- 403/404 Ownership Guard:  ${getVal("day1_auth_probe403_success")} / ${attempted}

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint        | p50      | p95      | p99      | Max      | Avg      |
|------------------------|----------|----------|----------|----------|----------|
| Login (POST /auth/login)| ${loginLat.med.padEnd(8)} | ${loginLat.p95.padEnd(8)} | ${loginLat.p99.padEnd(8)} | ${loginLat.max.padEnd(8)} | ${loginLat.avg.padEnd(8)} |
| Profile (GET /auth/me) | ${meLat.med.padEnd(8)} | ${meLat.p95.padEnd(8)} | ${meLat.p99.padEnd(8)} | ${meLat.max.padEnd(8)} | ${meLat.avg.padEnd(8)} |
| Refresh (/auth/refresh)| ${refLat.med.padEnd(8)} | ${refLat.p95.padEnd(8)} | ${refLat.p99.padEnd(8)} | ${refLat.max.padEnd(8)} | ${refLat.avg.padEnd(8)} |
| Combined Auth Flow     | ${totalLat.med.padEnd(8)} | ${totalLat.p95.padEnd(8)} | ${totalLat.p99.padEnd(8)} | ${totalLat.max.padEnd(8)} | ${totalLat.avg.padEnd(8)} |
================================================================================
`;

  return {
    stdout: report,
    "load-tests/reports/day1-test2-auth-session-report.md": report,
  };
}
