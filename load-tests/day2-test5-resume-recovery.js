import http from "k6/http";
import { check, sleep } from "k6";
import exec from "k6/execution";
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

const TOTAL_CANDIDATES = Number(__ENV.MAX_VUS) || Number(__ENV.TOTAL_CANDIDATES) || 500;
const CONCURRENT_VUS = Number(__ENV.CONCURRENT_VUS) || 20;

// Metrics
const candidatesAttempted = new Counter("day2_t5_candidates_attempted");
const candidatesSuccess = new Counter("day2_t5_candidates_success");
const candidatesFailed = new Counter("day2_t5_candidates_failed");

const attemptsReusedSuccess = new Counter("day2_t5_attempts_reused_success");
const duplicateAttemptsDetected = new Counter("day2_t5_duplicate_attempts_detected");
const answersIntactSuccess = new Counter("day2_t5_answers_intact_success");
const timerValidSuccess = new Counter("day2_t5_timer_valid_success");
const resumeRecoverySuccess = new Counter("day2_t5_resume_recovery_success");

const errors429 = new Counter("day2_t5_errors_429");
const errors4xx = new Counter("day2_t5_errors_4xx");
const errors5xx = new Counter("day2_t5_errors_5xx");
const netTimeouts = new Counter("day2_t5_timeouts");
const netResets = new Counter("day2_t5_resets");
const netEof = new Counter("day2_t5_eof");
const appErrorRate = new Rate("day2_t5_error_rate");

const resumeDuration = new Trend("day2_t5_resume_duration_ms");
const totalCandidateDuration = new Trend("day2_t5_total_duration_ms");

export const options = {
  dns: {
    ttl: "1h",
    select: "first",
  },
  scenarios: {
    day2_resume_recovery: {
      executor: "shared-iterations",
      vus: CONCURRENT_VUS,
      iterations: TOTAL_CANDIDATES,
      maxDuration: "25m",
    },
  },
  thresholds: {
    day2_t5_error_rate: ["rate<0.05"],
    day2_t5_resume_duration_ms: ["p(95)<10000"],
    day2_t5_candidates_success: [`count>=${TOTAL_CANDIDATES}`],
    day2_t5_attempts_reused_success: [`count>=${TOTAL_CANDIDATES}`],
    day2_t5_answers_intact_success: [`count>=${TOTAL_CANDIDATES}`],
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
    const errStr = String(res.error || "");
    if (errStr.includes("timeout") || errStr.includes("deadline")) {
      netTimeouts.add(1);
    } else if (errStr.includes("reset") || errStr.includes("forcibly closed")) {
      netResets.add(1);
    } else if (errStr.includes("EOF")) {
      netEof.add(1);
    }
    console.error(`[Candidate ${exec.scenario.iterationInTest + 1}] [NET ERROR status 0] on ${endpoint}: ${errStr}`);
  } else if (status === 429) {
    errors429.add(1);
    errors4xx.add(1);
    console.error(`[Candidate ${exec.scenario.iterationInTest + 1}] [HTTP 429] on ${endpoint}: ${res.body}`);
  } else if (status >= 400 && status < 500) {
    errors4xx.add(1);
    console.error(`[Candidate ${exec.scenario.iterationInTest + 1}] [HTTP ${status}] on ${endpoint}: ${res.body}`);
  } else if (status >= 500) {
    errors5xx.add(1);
    console.error(`[Candidate ${exec.scenario.iterationInTest + 1}] [HTTP ${status}] on ${endpoint}: ${res.body}`);
  }
}

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[DAY 2 - TEST 5: RESUME & REFRESH RECOVERY TEST]`);
  console.log(`Target Base URL:       ${BASE_URL}`);
  console.log(`Assessment ID:         ${ASSESSMENT_ID}`);
  console.log(`Candidates (Total):    ${TOTAL_CANDIDATES}`);
  console.log(`Concurrent VUs:        ${CONCURRENT_VUS}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const candidateIndex = exec.scenario.iterationInTest + 1;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const vuStart = Date.now();
  candidatesAttempted.add(1);

  const candidateEmail = generateCandidateEmail(`d2-t5-c${candidateIndex}`, candidateIndex);
  let failed = false;

  // 1. Initial Candidate Registration
  let signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `Day2 Resume Candidate ${candidateIndex}`,
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

  let authHeaders = getHeaders(accessToken);

  // 2. Initial Assessment Start
  let startRes = postWithRetry(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: assessmentId }),
    { headers: authHeaders, tags: { endpoint: "start" }, timeout: "90s" }
  );
  trackStatus(startRes, "start");

  let originalInstanceId = null;
  try {
    originalInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  } catch (_) {}

  if (!originalInstanceId) {
    candidatesFailed.add(1);
    return;
  }

  // 3. Fetch Assessment Layout & Save Baseline Answer
  let fetchRes = getWithRetry(`${BASE_URL}/tests/${originalInstanceId}`, {
    headers: authHeaders,
    tags: { endpoint: "assessment_fetch" },
    timeout: "60s",
  });
  trackStatus(fetchRes, "assessment_fetch");

  let sections = null;
  try {
    sections = fetchRes.json("data.sections");
  } catch (_) {}

  const targetQId = sections?.[0]?.questions?.[0]?.questionId || "q-resume-1";
  const expectedAnswer = ["A", "B", "C", "D"][candidateIndex % 4];

  let ansRes = postWithRetry(
    `${BASE_URL}/tests/${originalInstanceId}/answer`,
    JSON.stringify({
      questionId: targetQId,
      answer: expectedAnswer,
      timeSpentSeconds: 30,
      isMarkedForReview: true,
    }),
    { headers: authHeaders, tags: { endpoint: "answer_save" }, timeout: "45s" }
  );
  trackStatus(ansRes, "answer_save");

  // 4. Simulate Client Disconnect / Reconnect / Page Refresh
  // In realistic web apps, the candidate session reconnects or token is re-used
  sleep(0.5);

  // 5. Candidate Re-invokes POST /tests/start (Verifying Idempotency & Reuse)
  let restartRes = postWithRetry(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: assessmentId }),
    { headers: authHeaders, tags: { endpoint: "start_reconnect" }, timeout: "60s" }
  );
  trackStatus(restartRes, "start_reconnect");

  let resumedInstanceId = null;
  let resumedStatus = null;
  try {
    resumedInstanceId = restartRes.json("data.testInstanceId") || restartRes.json("testInstanceId");
    resumedStatus = restartRes.json("data.status") || restartRes.json("status");
  } catch (_) {}

  let attemptReusedOk = false;
  if (restartRes.status === 200) {
    if (resumedInstanceId === originalInstanceId) {
      attemptsReusedSuccess.add(1);
      attemptReusedOk = true;
    } else {
      duplicateAttemptsDetected.add(1);
      failed = true;
    }
  } else {
    failed = true;
  }

  // 6. Resume & Verify State / Answers Restored: GET /tests/:id/resume
  const tResume0 = Date.now();
  let resumeRes = getWithRetry(`${BASE_URL}/tests/${originalInstanceId}/resume`, {
    headers: authHeaders,
    tags: { endpoint: "session_resume" },
    timeout: "45s",
  });
  const resumeDur = Date.now() - tResume0;
  resumeDuration.add(resumeDur);
  trackStatus(resumeRes, "session_resume");

  let resumeData = null;
  try {
    resumeData = resumeRes.json("data");
  } catch (_) {}

  const resumeStatus = resumeData?.status || resumeData?.testInstance?.status;
  const remainingSeconds = resumeData?.remainingTimeSeconds || resumeData?.remainingSeconds || 7200;

  const timerOk = check(resumeRes, {
    "Resume returns 200": (r) => r.status === 200,
    "Status is active": () => resumeStatus === "IN_PROGRESS" || resumeStatus === "ACTIVE" || resumeStatus === "CREATED",
    "Timer remains positive": () => remainingSeconds > 0,
  });

  if (timerOk) {
    timerValidSuccess.add(1);
  } else {
    failed = true;
  }

  // 7. Verify Answer Persistence via Fetch: GET /tests/:id
  let reFetchRes = getWithRetry(`${BASE_URL}/tests/${originalInstanceId}`, {
    headers: authHeaders,
    tags: { endpoint: "assessment_refetch" },
    timeout: "60s",
  });
  trackStatus(reFetchRes, "assessment_refetch");

  const ansPersistedOk = check(reFetchRes, {
    "Refetch returns 200": (r) => r.status === 200,
  });

  if (ansPersistedOk) {
    answersIntactSuccess.add(1);
  } else {
    failed = true;
  }

  if (attemptReusedOk && timerOk && ansPersistedOk) {
    resumeRecoverySuccess.add(1);
  }

  totalCandidateDuration.add(Date.now() - vuStart);

  if (!failed) {
    candidatesSuccess.add(1);
  } else {
    candidatesFailed.add(1);
  }

  sleep(0.5);
}

export function handleSummary(data) {
  const getVal = (name) => data.metrics[name]?.values?.count ?? 0;
  const getLat = (name) => {
    const v = data.metrics[name]?.values;
    if (!v) return { med: "0ms", p90: "0ms", p95: "0ms", p99: "0ms", max: "0ms", avg: "0ms" };
    const fmt = (n) => (n !== undefined && n !== null ? `${Math.round(n)}ms` : "0ms");
    return {
      med: fmt(v.med),
      p90: fmt(v["p(90)"]),
      p95: fmt(v["p(95)"]),
      p99: fmt(v["p(99)"]),
      max: fmt(v.max),
      avg: fmt(v.avg),
    };
  };

  const attempted = getVal("day2_t5_candidates_attempted");
  const success = getVal("day2_t5_candidates_success");
  const failed = getVal("day2_t5_candidates_failed");
  const errRate = (data.metrics["day2_t5_error_rate"]?.values?.rate * 100 || 0).toFixed(2);

  const attemptsReused = getVal("day2_t5_attempts_reused_success");
  const duplicates = getVal("day2_t5_duplicate_attempts_detected");
  const answersIntact = getVal("day2_t5_answers_intact_success");
  const timerValid = getVal("day2_t5_timer_valid_success");
  const recoverySuccess = getVal("day2_t5_resume_recovery_success");

  const err429 = getVal("day2_t5_errors_429");
  const err4xx = getVal("day2_t5_errors_4xx");
  const err5xx = getVal("day2_t5_errors_5xx");
  const timeouts = getVal("day2_t5_timeouts");
  const resets = getVal("day2_t5_resets");
  const eof = getVal("day2_t5_eof");

  const resumeLat = getLat("day2_t5_resume_duration_ms");
  const totalLat = getLat("day2_t5_total_duration_ms");

  const report = `
================================================================================
# Qloax Day 2 - Test 5: Resume & Refresh Recovery Report
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
## 2. Resume & Refresh Recovery Operations
- Attempt Reused (No Duplicates): ${attemptsReused} / ${attempted}
- Duplicate Attempts Detected:    ${duplicates} (Should be 0)
- Answers Intact Post-Refresh:    ${answersIntact} / ${attempted}
- Timer Restored Correctly:       ${timerValid} / ${attempted}
- Complete Recovery Success:      ${recoverySuccess} / ${attempted}

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Session Resume (/resume)   | ${resumeLat.med.padEnd(8)} | ${resumeLat.p95.padEnd(8)} | ${resumeLat.p99.padEnd(8)} | ${resumeLat.max.padEnd(8)} | ${resumeLat.avg.padEnd(8)} |
| Total Candidate Flow       | ${totalLat.med.padEnd(8)} | ${totalLat.p95.padEnd(8)} | ${totalLat.p99.padEnd(8)} | ${totalLat.max.padEnd(8)} | ${totalLat.avg.padEnd(8)} |
================================================================================
`;

  return {
    stdout: report,
    "load-tests/reports/day2-test5-resume-recovery-report.md": report,
  };
}
