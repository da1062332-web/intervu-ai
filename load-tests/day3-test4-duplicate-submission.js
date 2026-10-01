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
const candidatesAttempted = new Counter("day3_t4_candidates_attempted");
const candidatesSuccess = new Counter("day3_t4_candidates_success");
const candidatesFailed = new Counter("day3_t4_candidates_failed");

const primarySubmitsSuccess = new Counter("day3_t4_primary_submits_success");
const duplicateSubmitsHandled = new Counter("day3_t4_duplicate_submits_handled");
const duplicateRecordsCreated = new Counter("day3_t4_duplicate_records_created");
const finalStateVerified = new Counter("day3_t4_final_state_verified");

const errors429 = new Counter("day3_t4_errors_429");
const errors4xx = new Counter("day3_t4_errors_4xx");
const errors5xx = new Counter("day3_t4_errors_5xx");
const netTimeouts = new Counter("day3_t4_timeouts");
const netResets = new Counter("day3_t4_resets");
const netEof = new Counter("day3_t4_eof");
const appErrorRate = new Rate("day3_t4_error_rate");

const primarySubmitDuration = new Trend("day3_t4_primary_submit_duration_ms");
const duplicateSubmitDuration = new Trend("day3_t4_duplicate_submit_duration_ms");
const totalCandidateDuration = new Trend("day3_t4_total_duration_ms");

export const options = {
  dns: {
    ttl: "1h",
    select: "first",
  },
  scenarios: {
    day3_duplicate_submission: {
      executor: "shared-iterations",
      vus: CONCURRENT_VUS,
      iterations: TOTAL_CANDIDATES,
      maxDuration: "25m",
    },
  },
  thresholds: {
    day3_t4_error_rate: ["rate<0.05"],
    day3_t4_candidates_success: [`count>=${TOTAL_CANDIDATES}`],
    day3_t4_primary_submits_success: [`count>=${TOTAL_CANDIDATES}`],
    day3_t4_duplicate_submits_handled: [`count>=${TOTAL_CANDIDATES * 2}`],
    day3_t4_duplicate_records_created: ["count<1"],
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
  // 409 Conflict on duplicate submit is an expected security/guard response per API contract
  const isErr = (status === 0 || status >= 400) && status !== 409;
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
  } else if (status >= 400 && status < 500 && status !== 409) {
    errors4xx.add(1);
    console.error(`[Candidate ${exec.scenario.iterationInTest + 1}] [HTTP ${status}] on ${endpoint}: ${res.body}`);
  } else if (status >= 500) {
    errors5xx.add(1);
    console.error(`[Candidate ${exec.scenario.iterationInTest + 1}] [HTTP ${status}] on ${endpoint}: ${res.body}`);
  }
}

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[DAY 3 - TEST 4: DUPLICATE SUBMISSION & IDEMPOTENCY]`);
  console.log(`Target Base URL:       ${BASE_URL}`);
  console.log(`Assessment ID:         ${ASSESSMENT_ID}`);
  console.log(`Candidates (Total):    ${TOTAL_CANDIDATES}`);
  console.log(`Concurrent VUs:        ${CONCURRENT_VUS}`);
  console.log(`Verification:          Primary Submit + 2x Rapid Duplicate Submits`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const candidateIndex = exec.scenario.iterationInTest + 1;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const vuStart = Date.now();
  candidatesAttempted.add(1);

  const candidateEmail = generateCandidateEmail(`d3-t4-c${candidateIndex}`, candidateIndex);
  let failed = false;

  // 1. Candidate Registration
  let signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `Day3 DupCandidate ${candidateIndex}`,
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
  const q0_1 = sec0?.questions?.[0]?.questionId || "q-sec0-1";

  sleep(0.5);

  // 4. Save Answer
  let ansRes = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: q0_1,
      answer: "A",
      timeSpentSeconds: 20,
      isMarkedForReview: false,
    }),
    { headers: authHeaders, tags: { endpoint: "answer_save" }, timeout: "45s" }
  );
  trackStatus(ansRes, "answer_save");

  sleep(0.5);

  // 5. Primary Assessment Submission
  const tSub1_0 = Date.now();
  let submitRes1 = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
    null,
    { headers: authHeaders, tags: { endpoint: "primary_submit" }, timeout: "60s" }
  );
  primarySubmitDuration.add(Date.now() - tSub1_0);
  trackStatus(submitRes1, "primary_submit");

  let firstSubmissionId = null;
  try {
    firstSubmissionId = submitRes1.json("data.submissionId") || submitRes1.json("submissionId");
  } catch (_) {}

  const primaryOk = check(submitRes1, {
    "Primary submit returns 200": (r) => r.status === 200,
    "Valid submission ID returned": () => Boolean(firstSubmissionId),
  });

  if (primaryOk) {
    primarySubmitsSuccess.add(1);
  } else {
    failed = true;
  }

  // 6. Rapid Duplicate Submission Attempt #1 (Immediate Re-Submission)
  const tSub2_0 = Date.now();
  let submitRes2 = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
    null,
    { headers: authHeaders, tags: { endpoint: "duplicate_submit_1" }, timeout: "45s" }
  );
  duplicateSubmitDuration.add(Date.now() - tSub2_0);
  trackStatus(submitRes2, "duplicate_submit_1");

  let sub2Id = null;
  try {
    sub2Id = submitRes2.json("data.submissionId") || submitRes2.json("submissionId");
  } catch (_) {}

  // Safe rejection or idempotent acceptance:
  // Status must be 409 Conflict OR 200 OK returning the EXACT SAME submissionId
  const dup1Ok = check(submitRes2, {
    "Duplicate 1 handled safely (200 or 409)": (r) => r.status === 200 || r.status === 409,
    "No new submission ID generated": () => !sub2Id || sub2Id === firstSubmissionId,
  });

  if (dup1Ok) {
    duplicateSubmitsHandled.add(1);
  } else {
    if (sub2Id && sub2Id !== firstSubmissionId) {
      duplicateRecordsCreated.add(1);
    }
    failed = true;
  }

  sleep(0.5);

  // 7. Duplicate Submission Attempt #2 (Slightly Delayed Re-Submission)
  const tSub3_0 = Date.now();
  let submitRes3 = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
    null,
    { headers: authHeaders, tags: { endpoint: "duplicate_submit_2" }, timeout: "45s" }
  );
  duplicateSubmitDuration.add(Date.now() - tSub3_0);
  trackStatus(submitRes3, "duplicate_submit_2");

  let sub3Id = null;
  try {
    sub3Id = submitRes3.json("data.submissionId") || submitRes3.json("submissionId");
  } catch (_) {}

  const dup2Ok = check(submitRes3, {
    "Duplicate 2 handled safely (200 or 409)": (r) => r.status === 200 || r.status === 409,
    "No new submission ID generated on 2nd dup": () => !sub3Id || sub3Id === firstSubmissionId,
  });

  if (dup2Ok) {
    duplicateSubmitsHandled.add(1);
  } else {
    if (sub3Id && sub3Id !== firstSubmissionId) {
      duplicateRecordsCreated.add(1);
    }
    failed = true;
  }

  // 8. Post-Submission State Integrity Check
  let verifyRes = getWithRetry(`${BASE_URL}/tests/${testInstanceId}/resume`, {
    headers: authHeaders,
    tags: { endpoint: "verify_resume" },
    timeout: "45s",
  });
  trackStatus(verifyRes, "verify_resume");

  let resumeStatus = null;
  try {
    resumeStatus = verifyRes.json("data.status") || verifyRes.json("data.testInstance.status");
  } catch (_) {}

  const stateOk = check(verifyRes, {
    "Resume returns 200 or 400": (r) => r.status === 200 || r.status === 400,
    "Status remains SUBMITTED": () =>
      !resumeStatus ||
      resumeStatus === "SUBMITTED" ||
      resumeStatus === "COMPLETED",
  });

  if (stateOk) {
    finalStateVerified.add(1);
  } else {
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

  const attempted = getVal("day3_t4_candidates_attempted");
  const success = getVal("day3_t4_candidates_success");
  const failed = getVal("day3_t4_candidates_failed");
  const errRate = (data.metrics["day3_t4_error_rate"]?.values?.rate * 100 || 0).toFixed(2);

  const primarySuccess = getVal("day3_t4_primary_submits_success");
  const dupsHandled = getVal("day3_t4_duplicate_submits_handled");
  const dupsCreated = getVal("day3_t4_duplicate_records_created");
  const verified = getVal("day3_t4_final_state_verified");

  const err429 = getVal("day3_t4_errors_429");
  const err4xx = getVal("day3_t4_errors_4xx");
  const err5xx = getVal("day3_t4_errors_5xx");
  const timeouts = getVal("day3_t4_timeouts");
  const resets = getVal("day3_t4_resets");
  const eof = getVal("day3_t4_eof");

  const primaryLat = getLat("day3_t4_primary_submit_duration_ms");
  const dupLat = getLat("day3_t4_duplicate_submit_duration_ms");
  const totalLat = getLat("day3_t4_total_duration_ms");

  const report = `
================================================================================
# Qloax Day 3 - Test 4: Duplicate Submission & Idempotency Report
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
## 2. Idempotency & Duplicate Guard Operations
- Primary Submissions:      ${primarySuccess} / ${attempted}
- Duplicate Submits Tested: ${attempted * 2} (2 per candidate)
- Duplicate Submits Guarded:${dupsHandled} / ${attempted * 2}
- Duplicate Records Created:${dupsCreated} (Should be 0)
- State Verified Correct:   ${verified} / ${attempted}

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Primary Submit (/submit)   | ${primaryLat.med.padEnd(8)} | ${primaryLat.p95.padEnd(8)} | ${primaryLat.p99.padEnd(8)} | ${primaryLat.max.padEnd(8)} | ${primaryLat.avg.padEnd(8)} |
| Duplicate Submit (/submit) | ${dupLat.med.padEnd(8)} | ${dupLat.p95.padEnd(8)} | ${dupLat.p99.padEnd(8)} | ${dupLat.max.padEnd(8)} | ${dupLat.avg.padEnd(8)} |
| Total Candidate Flow       | ${totalLat.med.padEnd(8)} | ${totalLat.p95.padEnd(8)} | ${totalLat.p99.padEnd(8)} | ${totalLat.max.padEnd(8)} | ${totalLat.avg.padEnd(8)} |
================================================================================
`;

  return {
    stdout: report,
    "load-tests/reports/day3-test4-duplicate-submission-report.md": report,
  };
}
