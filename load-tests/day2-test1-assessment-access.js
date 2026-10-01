import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";
import {
  BASE_URL,
  REFERRAL_CODE,
  ASSESSMENT_ID,
  SIGNUP_PASSWORD,
  TEST_RUN_ID,
  getHeaders,
  generateCandidateEmail,
} from "./common.js";

const MAX_VUS = Number(__ENV.MAX_VUS) || Number(__ENV.VUS) || 500;
const RAMP_WINDOW_SEC = Number(__ENV.RAMP_WINDOW_SEC) || 450;

// Metrics
const candidatesAttempted = new Counter("day2_t1_candidates_attempted");
const candidatesSuccess = new Counter("day2_t1_candidates_success");
const candidatesFailed = new Counter("day2_t1_candidates_failed");

const fetchSuccess = new Counter("day2_t1_fetch_success");
const statusSuccess = new Counter("day2_t1_status_success");
const resumeSuccess = new Counter("day2_t1_resume_success");
const stateRecoverySuccess = new Counter("day2_t1_state_recovery_success");

const errors429 = new Counter("day2_t1_errors_429");
const errors4xx = new Counter("day2_t1_errors_4xx");
const errors5xx = new Counter("day2_t1_errors_5xx");
const netTimeouts = new Counter("day2_t1_timeouts");
const netResets = new Counter("day2_t1_resets");
const netEof = new Counter("day2_t1_eof");
const appErrorRate = new Rate("day2_t1_error_rate");

const fetchDuration = new Trend("day2_t1_fetch_duration_ms");
const resumeDuration = new Trend("day2_t1_resume_duration_ms");
const totalAccessDuration = new Trend("day2_t1_total_duration_ms");

export const options = {
  dns: {
    ttl: "1h",
    select: "first",
  },
  scenarios: {
    day2_assessment_access: {
      executor: "per-vu-iterations",
      vus: MAX_VUS,
      iterations: 1,
      maxDuration: "15m",
    },
  },
  thresholds: {
    day2_t1_error_rate: ["rate<0.05"],
    day2_t1_fetch_duration_ms: ["p(95)<15000"],
    day2_t1_resume_duration_ms: ["p(95)<15000"],
    day2_t1_candidates_success: [`count>=${MAX_VUS}`],
  },
};

function postWithRetry(url, payload, params, maxRetries = 3) {
  let res;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    res = http.post(url, payload, params);
    if (res.status === 200 || res.status === 201) {
      return res;
    }
    if (res.status === 0 || res.status === 408 || res.status === 429 || res.status >= 500) {
      if (attempt < maxRetries) {
        sleep(2.0 * (attempt + 1));
        continue;
      }
    }
    break;
  }
  return res;
}

function getWithRetry(url, params, maxRetries = 3) {
  let res;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    res = http.get(url, params);
    if (res.status === 200) {
      return res;
    }
    if (res.status === 0 || res.status === 408 || res.status === 429 || res.status >= 500) {
      if (attempt < maxRetries) {
        sleep(2.0 * (attempt + 1));
        continue;
      }
    }
    break;
  }
  return res;
}

function trackStatus(res, endpoint) {
  const status = res.status;
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
    console.error(`[VU ${__VU}] [HTTP 429] on ${endpoint}: ${res.body}`);
  } else if (status >= 400 && status < 500) {
    errors4xx.add(1);
    console.error(`[VU ${__VU}] [HTTP ${status}] on ${endpoint}: ${res.body}`);
  } else if (status >= 500) {
    errors5xx.add(1);
    console.error(`[VU ${__VU}] [HTTP ${status}] on ${endpoint}: ${res.body}`);
  }
}

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[DAY 2 - TEST 1: ASSESSMENT ACCESS TEST]`);
  console.log(`Target Base URL:       ${BASE_URL}`);
  console.log(`Assessment ID:         ${ASSESSMENT_ID}`);
  console.log(`Candidates (VUs):      ${MAX_VUS}`);
  console.log(`Arrival Ramp Window:   ${RAMP_WINDOW_SEC}s`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const vuId = __VU;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  candidatesAttempted.add(1);

  // Stagger arrival across ramp window
  const arrivalStaggerSec = MAX_VUS > 1 ? (vuId - 1) * (RAMP_WINDOW_SEC / MAX_VUS) : 0;
  if (arrivalStaggerSec > 0) {
    sleep(arrivalStaggerSec);
  }

  const candidateEmail = generateCandidateEmail(`d2-t1-vu${vuId}`, vuId);
  let failed = false;

  // 1. Candidate Registration & Authentication
  let signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `Day2 Access Candidate VU${vuId}`,
      referralCode: REFERRAL_CODE,
    }),
    { headers: getHeaders(), tags: { endpoint: "signup" }, timeout: "60s" }
  );
  trackStatus(signupRes, "signup");

  let accessToken = null;
  try {
    accessToken = signupRes.json("data.accessToken") || signupRes.json("accessToken");
  } catch (_) {}

  if (!accessToken) {
    candidatesFailed.add(1);
    return;
  }

  const authHeaders = getHeaders(accessToken);

  // 2. Start Assessment
  let startRes = postWithRetry(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: assessmentId }),
    { headers: authHeaders, tags: { endpoint: "start" }, timeout: "90s" }
  );
  trackStatus(startRes, "start");

  let testInstanceId = null;
  try {
    testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  } catch (_) {}

  if (!testInstanceId) {
    candidatesFailed.add(1);
    return;
  }

  // -------------------------------------------------------------
  // Test 1: Simultaneous Assessment Access Flows
  // -------------------------------------------------------------

  // A. Assessment Fetch (GET /tests/:id)
  const tFetch0 = Date.now();
  let fetchRes = getWithRetry(`${BASE_URL}/tests/${testInstanceId}`, {
    headers: authHeaders,
    tags: { endpoint: "assessment_fetch" },
    timeout: "60s",
  });
  const fetchDur = Date.now() - tFetch0;
  fetchDuration.add(fetchDur);
  totalAccessDuration.add(fetchDur);
  trackStatus(fetchRes, "assessment_fetch");

  let sections = null;
  let testStatus = null;
  try {
    sections = fetchRes.json("data.sections");
    testStatus = fetchRes.json("data.status") || fetchRes.json("data.testInstance.status");
  } catch (_) {}

  const fetchOk = check(fetchRes, {
    "Fetch: returns 200": (r) => r.status === 200,
    "Fetch: sections available": () => Array.isArray(sections) && sections.length > 0,
  });
  if (fetchOk) fetchSuccess.add(1);
  else failed = true;

  // B. Session / Status Verification
  const statusOk = check(fetchRes, {
    "Status: instance is active/in_progress": () => testStatus === "IN_PROGRESS" || testStatus === "CREATED" || testStatus === "ACTIVE",
  });
  if (statusOk) statusSuccess.add(1);
  else failed = true;

  // C. Resume & State Recovery (GET /tests/:id/resume)
  const tResume0 = Date.now();
  let resumeRes = getWithRetry(`${BASE_URL}/tests/${testInstanceId}/resume`, {
    headers: authHeaders,
    tags: { endpoint: "session_resume" },
    timeout: "45s",
  });
  const resumeDur = Date.now() - tResume0;
  resumeDuration.add(resumeDur);
  totalAccessDuration.add(resumeDur);
  trackStatus(resumeRes, "session_resume");

  let resumeData = null;
  try {
    resumeData = resumeRes.json("data");
  } catch (_) {}

  const resumeOk = check(resumeRes, {
    "Resume: returns 200": (r) => r.status === 200,
    "Resume: attemptId matches": () => (resumeData?.testInstanceId || resumeData?.id) === testInstanceId,
  });
  if (resumeOk) resumeSuccess.add(1);
  else failed = true;

  // D. State Recovery Verification
  if (fetchOk && statusOk && resumeOk) {
    stateRecoverySuccess.add(1);
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

  const attempted = getVal("day2_t1_candidates_attempted");
  const success = getVal("day2_t1_candidates_success");
  const failed = getVal("day2_t1_candidates_failed");
  const err429 = getVal("day2_t1_errors_429");
  const err4xx = getVal("day2_t1_errors_4xx");
  const err5xx = getVal("day2_t1_errors_5xx");
  const timeouts = getVal("day2_t1_timeouts");
  const resets = getVal("day2_t1_resets");
  const eof = getVal("day2_t1_eof");
  const errRate = ((data.metrics.day2_t1_error_rate?.values?.rate ?? 0) * 100).toFixed(2);

  const fetchLat = getLat("day2_t1_fetch_duration_ms");
  const resumeLat = getLat("day2_t1_resume_duration_ms");
  const totalLat = getLat("day2_t1_total_duration_ms");

  const report = `
================================================================================
# Qloax Day 2 - Test 1: Assessment Access Report
================================================================================
Generated:                  ${new Date().toISOString()}
Target Environment:         ${BASE_URL}
Assessment ID:              ${ASSESSMENT_ID}
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
## 2. Assessment Access Operations
- Assessment Fetch:         ${getVal("day2_t1_fetch_success")} / ${attempted}
- Session Status Check:     ${getVal("day2_t1_status_success")} / ${attempted}
- Session Resume:           ${getVal("day2_t1_resume_success")} / ${attempted}
- State Recovery Success:   ${getVal("day2_t1_state_recovery_success")} / ${attempted}

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Assessment Fetch (/tests/id)| ${fetchLat.med.padEnd(8)} | ${fetchLat.p95.padEnd(8)} | ${fetchLat.p99.padEnd(8)} | ${fetchLat.max.padEnd(8)} | ${fetchLat.avg.padEnd(8)} |
| Session Resume (/resume)   | ${resumeLat.med.padEnd(8)} | ${resumeLat.p95.padEnd(8)} | ${resumeLat.p99.padEnd(8)} | ${resumeLat.max.padEnd(8)} | ${resumeLat.avg.padEnd(8)} |
| Combined In-Exam Access    | ${totalLat.med.padEnd(8)} | ${totalLat.p95.padEnd(8)} | ${totalLat.p99.padEnd(8)} | ${totalLat.max.padEnd(8)} | ${totalLat.avg.padEnd(8)} |
================================================================================
`;

  return {
    stdout: report,
    "load-tests/reports/day2-test1-assessment-access-report.md": report,
  };
}
