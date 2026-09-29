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
const RAMP_WINDOW_SEC = Number(__ENV.RAMP_WINDOW_SEC) || 60;

// Metrics
const candidatesAttempted = new Counter("day1_start_candidates_attempted");
const candidatesSuccess = new Counter("day1_start_candidates_success");
const candidatesFailed = new Counter("day1_start_candidates_failed");
const startTestSuccess = new Counter("day1_start_test_success");
const noDuplicateSessions = new Counter("day1_start_no_duplicate_sessions");
const dataIntegritySuccess = new Counter("day1_start_data_integrity_success");

const errors429 = new Counter("day1_start_errors_429");
const errors4xx = new Counter("day1_start_errors_4xx");
const errors5xx = new Counter("day1_start_errors_5xx");
const netTimeouts = new Counter("day1_start_timeouts");
const netResets = new Counter("day1_start_resets");
const netEof = new Counter("day1_start_eof");
const appErrorRate = new Rate("day1_start_error_rate");

const startTestDuration = new Trend("day1_start_test_duration_ms");
const snapshotDuration = new Trend("day1_start_snapshot_duration_ms");
const totalStartDuration = new Trend("day1_start_total_duration_ms");

export const options = {
  scenarios: {
    day1_assessment_start: {
      executor: "per-vu-iterations",
      vus: MAX_VUS,
      iterations: 1,
      maxDuration: "12m",
    },
  },
  thresholds: {
    day1_start_error_rate: ["rate<0.05"],
    day1_start_test_duration_ms: ["p(95)<30000"], // Assessment start is heavy PostgreSQL assembly (~11-15s)
    day1_start_candidates_success: [`count>=${MAX_VUS}`],
  },
};

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
  } else if (status >= 400 && status < 500) {
    errors4xx.add(1);
  } else if (status >= 500) {
    errors5xx.add(1);
  }
}

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[DAY 1 - TEST 3: ASSESSMENT START LOAD TEST]`);
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

  const candidateEmail = generateCandidateEmail(`start-d1-vu${vuId}`, vuId);

  // 1. Candidate Registration & Authentication
  const signupRes = http.post(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `Start Candidate VU${vuId}`,
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
    console.error(`[VU ${vuId}] Signup failed: ${signupRes.status}`);
    return;
  }

  const authHeaders = getHeaders(accessToken);

  // 2. Assessment Start (POST /tests/start)
  const tStart0 = Date.now();
  const startRes = http.post(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: assessmentId }),
    { headers: authHeaders, tags: { endpoint: "start_test" }, timeout: "60s" }
  );
  const startDur = Date.now() - tStart0;
  startTestDuration.add(startDur);
  totalStartDuration.add(startDur);
  trackStatus(startRes, "start_test");

  let testInstanceId = null;
  try {
    testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  } catch (_) {}

  const startOk = check(startRes, {
    "Start test returns 200": (r) => r.status === 200,
    "Test instance ID generated": () => Boolean(testInstanceId),
  });

  if (!startOk || !testInstanceId) {
    candidatesFailed.add(1);
    console.error(`[VU ${vuId}] Assessment start failed: ${startRes.status} ${startRes.body?.slice(0, 150)}`);
    return;
  }
  startTestSuccess.add(1);

  // 3. Verify No Duplicate Sessions (re-invoking start should return existing instance)
  const dupStartRes = http.post(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: assessmentId }),
    { headers: authHeaders, tags: { endpoint: "dup_start_check" }, timeout: "30s" }
  );
  trackStatus(dupStartRes, "dup_start_check");

  let dupInstanceId = null;
  try {
    dupInstanceId = dupStartRes.json("data.testInstanceId") || dupStartRes.json("testInstanceId");
  } catch (_) {}

  const noDup = check(dupStartRes, {
    "Duplicate start returns 200 or 409": (r) => r.status === 200 || r.status === 409,
    "Session is not duplicated (same instance returned)": () => dupInstanceId === testInstanceId || !dupInstanceId,
  });

  if (noDup) {
    noDuplicateSessions.add(1);
  } else {
    console.warn(`[VU ${vuId}] Duplicate session anomaly: first=${testInstanceId}, second=${dupInstanceId}`);
  }

  // 4. Verify Question Manifest & Data Corruption Check (GET /tests/:id)
  const tSnap0 = Date.now();
  const snapRes = http.get(`${BASE_URL}/tests/${testInstanceId}`, {
    headers: authHeaders,
    tags: { endpoint: "snapshot" },
    timeout: "30s",
  });
  const snapDur = Date.now() - tSnap0;
  snapshotDuration.add(snapDur);
  totalStartDuration.add(snapDur);
  trackStatus(snapRes, "snapshot");

  let sections = null;
  try {
    sections = snapRes.json("data.sections");
  } catch (_) {}

  const integrityOk = check(snapRes, {
    "Snapshot loaded with 200": (r) => r.status === 200,
    "Sections array intact and non-empty": () => Array.isArray(sections) && sections.length > 0,
    "Questions array populated in section 1": () => Array.isArray(sections?.[0]?.questions) && sections[0].questions.length > 0,
  });

  if (integrityOk) {
    dataIntegritySuccess.add(1);
    candidatesSuccess.add(1);
  } else {
    candidatesFailed.add(1);
    console.error(`[VU ${vuId}] Data corruption or snapshot failure: ${snapRes.status}`);
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

  const attempted = getVal("day1_start_candidates_attempted");
  const success = getVal("day1_start_candidates_success");
  const failed = getVal("day1_start_candidates_failed");
  const err429 = getVal("day1_start_errors_429");
  const err4xx = getVal("day1_start_errors_4xx");
  const err5xx = getVal("day1_start_errors_5xx");
  const timeouts = getVal("day1_start_timeouts");
  const resets = getVal("day1_start_resets");
  const eof = getVal("day1_start_eof");
  const errRate = ((data.metrics.day1_start_error_rate?.values?.rate ?? 0) * 100).toFixed(2);

  const startLat = getLat("day1_start_test_duration_ms");
  const snapLat = getLat("day1_start_snapshot_duration_ms");
  const totalLat = getLat("day1_start_total_duration_ms");

  const report = `
================================================================================
# Qloax Day 1 - Test 3: Assessment Start Report
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
## 2. Assessment Start & Data Integrity Verification
- Assessment Starts:        ${getVal("day1_start_test_success")} / ${attempted}
- No Duplicate Sessions:    ${getVal("day1_start_no_duplicate_sessions")} / ${attempted}
- Zero Data Corruption:     ${getVal("day1_start_data_integrity_success")} / ${attempted}

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Assessment Start (/start)  | ${startLat.med.padEnd(8)} | ${startLat.p95.padEnd(8)} | ${startLat.p99.padEnd(8)} | ${startLat.max.padEnd(8)} | ${startLat.avg.padEnd(8)} |
| Snapshot Load (/tests/:id) | ${snapLat.med.padEnd(8)} | ${snapLat.p95.padEnd(8)} | ${snapLat.p99.padEnd(8)} | ${snapLat.max.padEnd(8)} | ${snapLat.avg.padEnd(8)} |
| Total Provisioning Latency | ${totalLat.med.padEnd(8)} | ${totalLat.p95.padEnd(8)} | ${totalLat.p99.padEnd(8)} | ${totalLat.max.padEnd(8)} | ${totalLat.avg.padEnd(8)} |
================================================================================
`;

  return {
    stdout: report,
    "load-tests/reports/day1-test3-assessment-start-report.md": report,
  };
}
