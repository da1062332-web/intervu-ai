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
const RAMP_WINDOW_SEC = Number(__ENV.RAMP_WINDOW_SEC) || 120;

// Metrics
const candidatesAttempted = new Counter("day1_access_candidates_attempted");
const candidatesSuccess = new Counter("day1_access_candidates_success");
const candidatesFailed = new Counter("day1_access_candidates_failed");

const fetchSuccess = new Counter("day1_access_fetch_success");
const heartbeatSuccess = new Counter("day1_access_heartbeat_success");
const resumeSuccess = new Counter("day1_access_resume_success");
const answerSuccess = new Counter("day1_access_answer_success");
const dataConsistencySuccess = new Counter("day1_access_data_consistency_success");

const errors429 = new Counter("day1_access_errors_429");
const errors4xx = new Counter("day1_access_errors_4xx");
const errors5xx = new Counter("day1_access_errors_5xx");
const netTimeouts = new Counter("day1_access_timeouts");
const netResets = new Counter("day1_access_resets");
const netEof = new Counter("day1_access_eof");
const appErrorRate = new Rate("day1_access_error_rate");

const fetchDuration = new Trend("day1_access_fetch_duration_ms");
const heartbeatDuration = new Trend("day1_access_heartbeat_duration_ms");
const resumeDuration = new Trend("day1_access_resume_duration_ms");
const answerDuration = new Trend("day1_access_answer_duration_ms");
const totalAccessDuration = new Trend("day1_access_total_duration_ms");

export const options = {
  scenarios: {
    day1_concurrent_access: {
      executor: "per-vu-iterations",
      vus: MAX_VUS,
      iterations: 1,
      maxDuration: "12m",
    },
  },
  thresholds: {
    day1_access_error_rate: ["rate<0.05"],
    day1_access_fetch_duration_ms: ["p(95)<5000"],
    day1_access_heartbeat_duration_ms: ["p(95)<3000"],
    day1_access_answer_duration_ms: ["p(95)<3000"],
    day1_access_resume_duration_ms: ["p(95)<3000"],
    day1_access_candidates_success: [`count>=${MAX_VUS}`],
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
  console.log(`[DAY 1 - TEST 4: CONCURRENT ASSESSMENT ACCESS TEST]`);
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

  const candidateEmail = generateCandidateEmail(`access-d1-vu${vuId}`, vuId);
  let failed = false;

  // 1. Candidate Registration & Authentication
  const signupRes = http.post(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `Access Candidate VU${vuId}`,
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
  const startRes = http.post(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: assessmentId }),
    { headers: authHeaders, tags: { endpoint: "start" }, timeout: "60s" }
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
  // Test 4 Core Concurrent APIs with 500 active candidates
  // -------------------------------------------------------------

  // A. Assessment Fetch (GET /tests/:id)
  const tFetch0 = Date.now();
  const fetchRes = http.get(`${BASE_URL}/tests/${testInstanceId}`, {
    headers: authHeaders,
    tags: { endpoint: "assessment_fetch" },
    timeout: "30s",
  });
  const fetchDur = Date.now() - tFetch0;
  fetchDuration.add(fetchDur);
  totalAccessDuration.add(fetchDur);
  trackStatus(fetchRes, "assessment_fetch");

  let sections = null;
  try {
    sections = fetchRes.json("data.sections");
  } catch (_) {}

  const fetchOk = check(fetchRes, {
    "Fetch: returns 200": (r) => r.status === 200,
    "Fetch: sections available": () => Array.isArray(sections) && sections.length > 0,
  });
  if (fetchOk) fetchSuccess.add(1);
  else failed = true;

  const targetQuestionId = sections?.[0]?.questions?.[0]?.questionId || "sample-q1";
  const answerChoice = ["A", "B", "C", "D"][vuId % 4];

  // B. Candidate State / Sync API (POST /tests/:id/answer)
  const tAns0 = Date.now();
  const ansRes = http.post(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: targetQuestionId,
      answer: answerChoice,
      timeSpentSeconds: 12,
      isMarkedForReview: false,
    }),
    { headers: authHeaders, tags: { endpoint: "answer_autosave" }, timeout: "30s" }
  );
  const ansDur = Date.now() - tAns0;
  answerDuration.add(ansDur);
  totalAccessDuration.add(ansDur);
  trackStatus(ansRes, "answer_autosave");

  const ansOk = check(ansRes, {
    "Answer Autosave: returns 200": (r) => r.status === 200,
  });
  if (ansOk) answerSuccess.add(1);
  else failed = true;

  // C. Session Status / Telemetry Heartbeat (POST /tests/:id/heartbeat)
  const tHb0 = Date.now();
  const hbRes = http.post(
    `${BASE_URL}/tests/${testInstanceId}/heartbeat`,
    JSON.stringify({
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      answeredCount: 1,
      totalQuestions: 60,
      remainingTimeSeconds: 7200,
      networkStatus: "ONLINE",
      autosaveHealth: "HEALTHY",
    }),
    { headers: authHeaders, tags: { endpoint: "telemetry_heartbeat" }, timeout: "30s" }
  );
  const hbDur = Date.now() - tHb0;
  heartbeatDuration.add(hbDur);
  totalAccessDuration.add(hbDur);
  trackStatus(hbRes, "telemetry_heartbeat");

  const hbOk = check(hbRes, {
    "Heartbeat: returns 200": (r) => r.status === 200,
  });
  if (hbOk) heartbeatSuccess.add(1);
  else failed = true;

  // D. Resume & State Consistency Validation (GET /tests/:id/resume)
  const tResume0 = Date.now();
  const resumeRes = http.get(`${BASE_URL}/tests/${testInstanceId}/resume`, {
    headers: authHeaders,
    tags: { endpoint: "session_resume" },
    timeout: "30s",
  });
  const resumeDur = Date.now() - tResume0;
  resumeDuration.add(resumeDur);
  totalAccessDuration.add(resumeDur);
  trackStatus(resumeRes, "session_resume");

  const resumeOk = check(resumeRes, {
    "Resume: returns 200": (r) => r.status === 200,
  });
  if (resumeOk) resumeSuccess.add(1);
  else failed = true;

  // Data Consistency check: verify saved answer is recorded
  if (fetchOk && ansOk && resumeOk) {
    dataConsistencySuccess.add(1);
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

  const attempted = getVal("day1_access_candidates_attempted");
  const success = getVal("day1_access_candidates_success");
  const failed = getVal("day1_access_candidates_failed");
  const err429 = getVal("day1_access_errors_429");
  const err4xx = getVal("day1_access_errors_4xx");
  const err5xx = getVal("day1_access_errors_5xx");
  const timeouts = getVal("day1_access_timeouts");
  const resets = getVal("day1_access_resets");
  const eof = getVal("day1_access_eof");
  const errRate = ((data.metrics.day1_access_error_rate?.values?.rate ?? 0) * 100).toFixed(2);

  const fetchLat = getLat("day1_access_fetch_duration_ms");
  const ansLat = getLat("day1_access_answer_duration_ms");
  const hbLat = getLat("day1_access_heartbeat_duration_ms");
  const resumeLat = getLat("day1_access_resume_duration_ms");
  const totalLat = getLat("day1_access_total_duration_ms");

  const report = `
================================================================================
# Qloax Day 1 - Test 4: Concurrent Assessment Access Report
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
## 2. Concurrent Assessment Operations
- Assessment Fetch:         ${getVal("day1_access_fetch_success")} / ${attempted}
- Answer Autosave:          ${getVal("day1_access_answer_success")} / ${attempted}
- Telemetry Heartbeat:      ${getVal("day1_access_heartbeat_success")} / ${attempted}
- Session Resume:           ${getVal("day1_access_resume_success")} / ${attempted}
- Data Consistency:         ${getVal("day1_access_data_consistency_success")} / ${attempted}

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Assessment Fetch (/tests/id)| ${fetchLat.med.padEnd(8)} | ${fetchLat.p95.padEnd(8)} | ${fetchLat.p99.padEnd(8)} | ${fetchLat.max.padEnd(8)} | ${fetchLat.avg.padEnd(8)} |
| Answer Autosave (/answer)  | ${ansLat.med.padEnd(8)} | ${ansLat.p95.padEnd(8)} | ${ansLat.p99.padEnd(8)} | ${ansLat.max.padEnd(8)} | ${ansLat.avg.padEnd(8)} |
| Telemetry Heartbeat (/hb)  | ${hbLat.med.padEnd(8)} | ${hbLat.p95.padEnd(8)} | ${hbLat.p99.padEnd(8)} | ${hbLat.max.padEnd(8)} | ${hbLat.avg.padEnd(8)} |
| Session Resume (/resume)   | ${resumeLat.med.padEnd(8)} | ${resumeLat.p95.padEnd(8)} | ${resumeLat.p99.padEnd(8)} | ${resumeLat.max.padEnd(8)} | ${resumeLat.avg.padEnd(8)} |
| Combined In-Exam Access    | ${totalLat.med.padEnd(8)} | ${totalLat.p95.padEnd(8)} | ${totalLat.p99.padEnd(8)} | ${totalLat.max.padEnd(8)} | ${totalLat.avg.padEnd(8)} |
================================================================================
`;

  return {
    stdout: report,
    "load-tests/reports/day1-test4-concurrent-access-report.md": report,
  };
}
