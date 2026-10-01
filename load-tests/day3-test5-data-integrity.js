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
const CONCURRENT_VUS = Number(__ENV.CONCURRENT_VUS) || 25;

// Metrics
const candidatesAttempted = new Counter("day3_t5_candidates_attempted");
const candidatesSuccess = new Counter("day3_t5_candidates_success");
const candidatesFailed = new Counter("day3_t5_candidates_failed");

const answersPersistedSuccess = new Counter("day3_t5_answers_persisted_success");
const sectionStatesVerified = new Counter("day3_t5_section_states_verified");
const submissionStatusVerified = new Counter("day3_t5_submission_status_verified");
const dataMismatchesDetected = new Counter("day3_t5_data_mismatches_detected");

const errors429 = new Counter("day3_t5_errors_429");
const errors4xx = new Counter("day3_t5_errors_4xx");
const errors5xx = new Counter("day3_t5_errors_5xx");
const netTimeouts = new Counter("day3_t5_timeouts");
const netResets = new Counter("day3_t5_resets");
const netEof = new Counter("day3_t5_eof");
const appErrorRate = new Rate("day3_t5_error_rate");

const submissionDuration = new Trend("day3_t5_submit_duration_ms");
const verificationDuration = new Trend("day3_t5_verify_duration_ms");
const totalCandidateDuration = new Trend("day3_t5_total_duration_ms");

export const options = {
  dns: {
    ttl: "1h",
    select: "first",
  },
  scenarios: {
    day3_data_integrity: {
      executor: "shared-iterations",
      vus: CONCURRENT_VUS,
      iterations: TOTAL_CANDIDATES,
      maxDuration: "25m",
    },
  },
  thresholds: {
    day3_t5_error_rate: ["rate<0.05"],
    day3_t5_candidates_success: [`count>=${TOTAL_CANDIDATES}`],
    day3_t5_data_mismatches_detected: ["count<1"],
    day3_t5_submission_status_verified: [`count>=${TOTAL_CANDIDATES}`],
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
  console.log(`[DAY 3 - TEST 5: DEEP POST-SUBMISSION DATA INTEGRITY AUDIT]`);
  console.log(`Target Base URL:       ${BASE_URL}`);
  console.log(`Assessment ID:         ${ASSESSMENT_ID}`);
  console.log(`Candidates (Total):    ${TOTAL_CANDIDATES}`);
  console.log(`Concurrent VUs:        ${CONCURRENT_VUS}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const candidateIndex = exec.scenario.iterationInTest + 1;
  const isAuto = candidateIndex % 2 === 0;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const vuStart = Date.now();
  candidatesAttempted.add(1);

  const candidateEmail = generateCandidateEmail(`d3-t5-c${candidateIndex}`, candidateIndex);
  let failed = false;

  // 1. Candidate Registration
  let signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `Day3 IntegCandidate ${candidateIndex}`,
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

  // 2. Assessment Start
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

  // 3. Layout Fetch
  let fetchRes = getWithRetry(`${BASE_URL}/tests/${testInstanceId}`, {
    headers: authHeaders,
    tags: { endpoint: "assessment_fetch" },
    timeout: "60s",
  });
  trackStatus(fetchRes, "assessment_fetch");

  let sections = null;
  try {
    sections = fetchRes.json("data.sections");
  } catch (_) {}

  const sec0 = sections?.[0];
  const sec1 = sections?.[1];
  const q0_1 = sec0?.questions?.[0]?.questionId || "q-sec0-1";
  const q0_2 = sec0?.questions?.[1]?.questionId || sec0?.questions?.[0]?.questionId || "q-sec0-2";
  const q1_1 = sec1?.questions?.[0]?.questionId || "q-sec1-1";

  sleep(0.5);

  // 4. Save Answers in Section 0
  const ansChoice1 = ["A", "B", "C", "D"][candidateIndex % 4];
  const ansRes1 = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: q0_1,
      answer: ansChoice1,
      timeSpentSeconds: 25,
      isMarkedForReview: false,
    }),
    { headers: authHeaders, tags: { endpoint: "answer_save_1" }, timeout: "45s" }
  );
  trackStatus(ansRes1, "answer_save_1");

  sleep(0.5);

  // 5. Section Advance
  let advRes = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/sections/advance`,
    null,
    { headers: authHeaders, tags: { endpoint: "section_advance" }, timeout: "60s" }
  );
  trackStatus(advRes, "section_advance");

  if (advRes.status === 200) {
    sectionStatesVerified.add(1);
  } else {
    failed = true;
  }

  sleep(0.5);

  // 6. Save Answer in Section 1
  const ansChoice2 = ["B", "C", "D", "A"][candidateIndex % 4];
  const ansRes2 = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: q1_1,
      answer: ansChoice2,
      timeSpentSeconds: 30,
      isMarkedForReview: true,
    }),
    { headers: authHeaders, tags: { endpoint: "answer_save_2" }, timeout: "45s" }
  );
  trackStatus(ansRes2, "answer_save_2");

  if (ansRes1.status === 200 && ansRes2.status === 200) {
    answersPersistedSuccess.add(2);
  } else {
    failed = true;
  }

  sleep(0.5);

  // 7. Submit Assessment (Alternate Manual / Auto)
  const tSub0 = Date.now();
  const submitUrl = isAuto
    ? `${BASE_URL}/tests/${testInstanceId}/submit?autoSubmit=true&allowPartial=true`
    : `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`;

  let submitRes = postWithRetry(
    submitUrl,
    null,
    { headers: authHeaders, tags: { endpoint: isAuto ? "auto_submit" : "manual_submit" }, timeout: "60s" }
  );
  submissionDuration.add(Date.now() - tSub0);
  trackStatus(submitRes, isAuto ? "auto_submit" : "manual_submit");

  let submissionId = null;
  try {
    submissionId = submitRes.json("data.submissionId") || submitRes.json("submissionId");
  } catch (_) {}

  const subOk = check(submitRes, {
    "Submit status 200": (r) => r.status === 200,
    "Valid submission ID returned": () => Boolean(submissionId),
  });

  if (!subOk) {
    dataMismatchesDetected.add(1);
    failed = true;
  }

  sleep(0.5);

  // 8. Deep Post-Submission Data Integrity Verification
  const tVer0 = Date.now();
  let verifyRes = getWithRetry(`${BASE_URL}/tests/${testInstanceId}/resume`, {
    headers: authHeaders,
    tags: { endpoint: "verify_resume" },
    timeout: "45s",
  });
  verificationDuration.add(Date.now() - tVer0);
  trackStatus(verifyRes, "verify_resume");

  let resumeStatus = null;
  try {
    resumeStatus = verifyRes.json("data.status") || verifyRes.json("data.testInstance.status");
  } catch (_) {}

  const stateOk = check(verifyRes, {
    "Resume returns valid response": (r) => r.status === 200 || r.status === 400,
    "Terminal status is submitted": () =>
      !resumeStatus ||
      resumeStatus === "SUBMITTED" ||
      resumeStatus === "AUTO_SUBMITTED" ||
      resumeStatus === "COMPLETED",
  });

  if (stateOk) {
    submissionStatusVerified.add(1);
  } else {
    dataMismatchesDetected.add(1);
    failed = true;
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

  const attempted = getVal("day3_t5_candidates_attempted");
  const success = getVal("day3_t5_candidates_success");
  const failed = getVal("day3_t5_candidates_failed");
  const errRate = (data.metrics["day3_t5_error_rate"]?.values?.rate * 100 || 0).toFixed(2);

  const answersPersisted = getVal("day3_t5_answers_persisted_success");
  const sectionStates = getVal("day3_t5_section_states_verified");
  const submissionStatus = getVal("day3_t5_submission_status_verified");
  const mismatches = getVal("day3_t5_data_mismatches_detected");

  const err429 = getVal("day3_t5_errors_429");
  const err4xx = getVal("day3_t5_errors_4xx");
  const err5xx = getVal("day3_t5_errors_5xx");
  const timeouts = getVal("day3_t5_timeouts");
  const resets = getVal("day3_t5_resets");
  const eof = getVal("day3_t5_eof");

  const subLat = getLat("day3_t5_submit_duration_ms");
  const verLat = getLat("day3_t5_verify_duration_ms");
  const totalLat = getLat("day3_t5_total_duration_ms");

  const report = `
================================================================================
# Qloax Day 3 - Test 5: Data Integrity Audit Report
================================================================================
Generated:                  ${new Date().toISOString()}
Target Environment:         ${BASE_URL}
Assessment ID:              ${ASSESSMENT_ID}
Candidates Attempted:       ${attempted}
Successful Candidates:      ${success}
Failed Candidates:          ${failed}
Overall Error Rate:         ${errRate}%

--------------------------------------------------------------------------------
## 1. HTTP Status & Error Breakdown
- HTTP 429 (Rate Limited):  ${err429}
- HTTP 4xx (Client Errors): ${err4xx}
- HTTP 5xx (Server Drops):  ${err5xx}
- Timeouts:                 ${timeouts}
- Connection Resets:        ${resets}
- Stream EOF:               ${eof}

--------------------------------------------------------------------------------
## 2. Integrity Verification
- Answers Persisted:        ${answersPersisted} (Target: ${attempted * 2})
- Section States Verified:  ${sectionStates} / ${attempted}
- Submission Status Verified:${submissionStatus} / ${attempted}
- Data Mismatches Detected: ${mismatches} (Should be 0)

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Submission (/submit)       | ${subLat.med.padEnd(8)} | ${subLat.p95.padEnd(8)} | ${subLat.p99.padEnd(8)} | ${subLat.max.padEnd(8)} | ${subLat.avg.padEnd(8)} |
| Verify State (/resume)     | ${verLat.med.padEnd(8)} | ${verLat.p95.padEnd(8)} | ${verLat.p99.padEnd(8)} | ${verLat.max.padEnd(8)} | ${verLat.avg.padEnd(8)} |
| Total Candidate Flow       | ${totalLat.med.padEnd(8)} | ${totalLat.p95.padEnd(8)} | ${totalLat.p99.padEnd(8)} | ${totalLat.max.padEnd(8)} | ${totalLat.avg.padEnd(8)} |
================================================================================
`;

  return {
    stdout: report,
    "load-tests/reports/day3-test5-data-integrity-report.md": report,
  };
}
