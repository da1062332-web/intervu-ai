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
const RAMP_WINDOW_SEC = Number(__ENV.RAMP_WINDOW_SEC) || 500;

// Metrics
const candidatesAttempted = new Counter("day2_t4_candidates_attempted");
const candidatesSuccess = new Counter("day2_t4_candidates_success");
const candidatesFailed = new Counter("day2_t4_candidates_failed");

const sectionAdvanceAttempted = new Counter("day2_t4_section_advance_attempted");
const sectionAdvanceSuccess = new Counter("day2_t4_section_advance_success");
const sectionAdvanceFailed = new Counter("day2_t4_section_advance_failed");

const preAdvanceAnswersSuccess = new Counter("day2_t4_pre_advance_answers_success");
const postAdvanceAnswersSuccess = new Counter("day2_t4_post_advance_answers_success");
const stateIntegritySuccess = new Counter("day2_t4_state_integrity_success");

const errors429 = new Counter("day2_t4_errors_429");
const errors4xx = new Counter("day2_t4_errors_4xx");
const errors5xx = new Counter("day2_t4_errors_5xx");
const netTimeouts = new Counter("day2_t4_timeouts");
const netResets = new Counter("day2_t4_resets");
const netEof = new Counter("day2_t4_eof");
const appErrorRate = new Rate("day2_t4_error_rate");

const sectionAdvanceDuration = new Trend("day2_t4_section_advance_duration_ms");
const totalCandidateDuration = new Trend("day2_t4_total_duration_ms");

export const options = {
  dns: {
    ttl: "1h",
    select: "first",
  },
  scenarios: {
    day2_section_transitions: {
      executor: "per-vu-iterations",
      vus: MAX_VUS,
      iterations: 1,
      maxDuration: "16m",
    },
  },
  thresholds: {
    day2_t4_error_rate: ["rate<0.05"],
    day2_t4_section_advance_duration_ms: ["p(95)<10000"],
    day2_t4_candidates_success: [`count>=${MAX_VUS}`],
    day2_t4_section_advance_success: [`count>=${MAX_VUS}`],
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
  console.log(`[DAY 2 - TEST 4: SECTION TRANSITIONS CONCURRENCY TEST]`);
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
  const vuStart = Date.now();
  candidatesAttempted.add(1);

  // Stagger arrival across ramp window
  const arrivalStaggerSec = MAX_VUS > 1 ? (vuId - 1) * (RAMP_WINDOW_SEC / MAX_VUS) : 0;
  if (arrivalStaggerSec > 0) {
    sleep(arrivalStaggerSec);
  }

  const candidateEmail = generateCandidateEmail(`d2-t4-vu${vuId}`, vuId);
  let failed = false;

  // 1. Registration
  let signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `Day2 Section Candidate VU${vuId}`,
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

  // 3. Assessment Fetch to retrieve sections & questions
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

  const sec0Questions = sections?.[0]?.questions || [];
  const sec1Questions = sections?.[1]?.questions || [];

  const qSec0 = sec0Questions[0]?.questionId || "q-sec0-1";
  const qSec1 = sec1Questions[0]?.questionId || "q-sec1-1";

  // 4. Save Answer in Section 0 (Pre-Advance)
  let preAnsRes = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: qSec0,
      answer: "A",
      timeSpentSeconds: 20,
      isMarkedForReview: false,
    }),
    { headers: authHeaders, tags: { endpoint: "answer_pre_advance" }, timeout: "45s" }
  );
  trackStatus(preAnsRes, "answer_pre_advance");

  const preAnsOk = check(preAnsRes, {
    "Pre-advance answer saved (200)": (r) => r.status === 200,
  });
  if (preAnsOk) preAdvanceAnswersSuccess.add(1);
  else failed = true;

  sleep(1.0);

  // 5. Advance Section: POST /tests/:id/sections/advance
  sectionAdvanceAttempted.add(1);
  const tAdv0 = Date.now();
  let advRes = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/sections/advance`,
    null,
    { headers: authHeaders, tags: { endpoint: "section_advance" }, timeout: "45s" }
  );
  const advDur = Date.now() - tAdv0;
  sectionAdvanceDuration.add(advDur);
  trackStatus(advRes, "section_advance");

  let advData = null;
  try {
    advData = advRes.json("data") || advRes.json();
  } catch (_) {}

  const advOk = check(advRes, {
    "Section advance returns 200": (r) => r.status === 200,
    "Next section index is 1": () => advData?.nextSectionIndex === 1,
    "Not submitted": () => advData?.submitted === false,
  });

  if (advOk) {
    sectionAdvanceSuccess.add(1);
  } else {
    sectionAdvanceFailed.add(1);
    failed = true;
  }

  sleep(1.0);

  // 6. Save Answer in Section 1 (Post-Advance)
  let postAnsRes = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: qSec1,
      answer: "B",
      timeSpentSeconds: 25,
      isMarkedForReview: false,
    }),
    { headers: authHeaders, tags: { endpoint: "answer_post_advance" }, timeout: "45s" }
  );
  trackStatus(postAnsRes, "answer_post_advance");

  const postAnsOk = check(postAnsRes, {
    "Post-advance answer saved (200)": (r) => r.status === 200,
  });
  if (postAnsOk) postAdvanceAnswersSuccess.add(1);
  else failed = true;

  // 7. Verify Resume & State Integrity
  let resumeRes = getWithRetry(`${BASE_URL}/tests/${testInstanceId}/resume`, {
    headers: authHeaders,
    tags: { endpoint: "session_resume" },
    timeout: "45s",
  });
  trackStatus(resumeRes, "session_resume");

  let resumeData = null;
  try {
    resumeData = resumeRes.json("data");
  } catch (_) {}

  const stateOk = check(resumeRes, {
    "Resume returns 200": (r) => r.status === 200,
    "Current section is active in resume": () => resumeData !== null,
  });

  if (preAnsOk && advOk && postAnsOk && stateOk) {
    stateIntegritySuccess.add(1);
  }

  totalCandidateDuration.add(Date.now() - vuStart);

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

  const attempted = getVal("day2_t4_candidates_attempted");
  const success = getVal("day2_t4_candidates_success");
  const failed = getVal("day2_t4_candidates_failed");

  const advAttempted = getVal("day2_t4_section_advance_attempted");
  const advSuccess = getVal("day2_t4_section_advance_success");
  const advFailed = getVal("day2_t4_section_advance_failed");

  const preAnsSuccess = getVal("day2_t4_pre_advance_answers_success");
  const postAnsSuccess = getVal("day2_t4_post_advance_answers_success");
  const stateSuccess = getVal("day2_t4_state_integrity_success");

  const err429 = getVal("day2_t4_errors_429");
  const err4xx = getVal("day2_t4_errors_4xx");
  const err5xx = getVal("day2_t4_errors_5xx");
  const timeouts = getVal("day2_t4_timeouts");
  const resets = getVal("day2_t4_resets");
  const eof = getVal("day2_t4_eof");
  const errRate = ((data.metrics.day2_t4_error_rate?.values?.rate ?? 0) * 100).toFixed(2);

  const advLat = getLat("day2_t4_section_advance_duration_ms");
  const totalLat = getLat("day2_t4_total_duration_ms");

  const report = `
================================================================================
# Qloax Day 2 - Test 4: Section Transitions Report
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
## 2. Section Transition & State Integrity Operations
- Section Advances Attempted: ${advAttempted}
- Section Advances Succeeded: ${advSuccess}
- Section Advances Failed:    ${advFailed}
- Pre-Advance Answers Saved:  ${preAnsSuccess} / ${attempted}
- Post-Advance Answers Saved: ${postAnsSuccess} / ${attempted}
- Total State Integrity:      ${stateSuccess} / ${attempted}

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Section Advance (/advance) | ${advLat.med.padEnd(8)} | ${advLat.p95.padEnd(8)} | ${advLat.p99.padEnd(8)} | ${advLat.max.padEnd(8)} | ${advLat.avg.padEnd(8)} |
| Total Candidate Flow       | ${totalLat.med.padEnd(8)} | ${totalLat.p95.padEnd(8)} | ${totalLat.p99.padEnd(8)} | ${totalLat.max.padEnd(8)} | ${totalLat.avg.padEnd(8)} |
================================================================================
`;

  return {
    stdout: report,
    "load-tests/reports/day2-test4-section-transitions-report.md": report,
  };
}
