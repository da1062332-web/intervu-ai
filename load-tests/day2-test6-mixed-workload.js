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

// Metric Counters
const candidatesAttempted = new Counter("day2_t6_candidates_attempted");
const candidatesSuccess = new Counter("day2_t6_candidates_success");
const candidatesFailed = new Counter("day2_t6_candidates_failed");

const navigationsSuccess = new Counter("day2_t6_navigations_success");
const answersSavedTotal = new Counter("day2_t6_answers_saved_total");
const answerUpdatesTotal = new Counter("day2_t6_answer_updates_total");
const heartbeatsTotal = new Counter("day2_t6_heartbeats_total");
const sectionTransitionsTotal = new Counter("day2_t6_section_transitions_total");
const resumesReusedTotal = new Counter("day2_t6_resumes_reused_total");

// Error Counters
const errors429 = new Counter("day2_t6_errors_429");
const errors4xx = new Counter("day2_t6_errors_4xx");
const errors5xx = new Counter("day2_t6_errors_5xx");
const netTimeouts = new Counter("day2_t6_timeouts");
const netResets = new Counter("day2_t6_resets");
const netEof = new Counter("day2_t6_eof");
const appErrorRate = new Rate("day2_t6_error_rate");

// Latency Trends
const startDuration = new Trend("day2_t6_start_duration_ms");
const fetchDuration = new Trend("day2_t6_fetch_duration_ms");
const answerDuration = new Trend("day2_t6_answer_duration_ms");
const heartbeatDuration = new Trend("day2_t6_heartbeat_duration_ms");
const sectionAdvanceDuration = new Trend("day2_t6_advance_duration_ms");
const resumeDuration = new Trend("day2_t6_resume_duration_ms");
const totalCandidateDuration = new Trend("day2_t6_total_duration_ms");

export const options = {
  dns: {
    ttl: "1h",
    select: "first",
  },
  scenarios: {
    day2_mixed_workload: {
      executor: "shared-iterations",
      vus: CONCURRENT_VUS,
      iterations: TOTAL_CANDIDATES,
      maxDuration: "25m",
    },
  },
  thresholds: {
    day2_t6_error_rate: ["rate<0.05"],
    day2_t6_candidates_success: [`count>=${TOTAL_CANDIDATES}`],
    day2_t6_answers_saved_total: [`count>=${TOTAL_CANDIDATES * 2}`],
    day2_t6_heartbeats_total: [`count>=${TOTAL_CANDIDATES * 2}`],
    day2_t6_section_transitions_total: [`count>=${TOTAL_CANDIDATES}`],
    day2_t6_resumes_reused_total: [`count>=${TOTAL_CANDIDATES}`],
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
  console.log(`[DAY 2 - TEST 6: MIXED REALISTIC 500-CANDIDATE WORKLOAD]`);
  console.log(`Target Base URL:       ${BASE_URL}`);
  console.log(`Assessment ID:         ${ASSESSMENT_ID}`);
  console.log(`Candidates (Total):    ${TOTAL_CANDIDATES}`);
  console.log(`Concurrent VUs:        ${CONCURRENT_VUS}`);
  console.log(`Candidate Activities:  Nav, Answers, Changes, Heartbeats, Transitions, Resume`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const candidateIndex = exec.scenario.iterationInTest + 1;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const vuStart = Date.now();
  candidatesAttempted.add(1);

  const candidateEmail = generateCandidateEmail(`d2-t6-c${candidateIndex}`, candidateIndex);
  let failed = false;

  // 1. Candidate Registration
  let signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `Day2 Mixed Candidate ${candidateIndex}`,
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
  const tStart0 = Date.now();
  let startRes = postWithRetry(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: assessmentId }),
    { headers: authHeaders, tags: { endpoint: "start" }, timeout: "90s" }
  );
  startDuration.add(Date.now() - tStart0);
  trackStatus(startRes, "start");

  let originalInstanceId = null;
  try {
    originalInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  } catch (_) {}

  if (!originalInstanceId) {
    candidatesFailed.add(1);
    return;
  }

  // 3. Initial Layout / Question Navigation Fetch
  const tFetch0 = Date.now();
  let fetchRes = getWithRetry(`${BASE_URL}/tests/${originalInstanceId}`, {
    headers: authHeaders,
    tags: { endpoint: "assessment_fetch" },
    timeout: "60s",
  });
  fetchDuration.add(Date.now() - tFetch0);
  trackStatus(fetchRes, "assessment_fetch");

  let sections = null;
  try {
    sections = fetchRes.json("data.sections");
  } catch (_) {}

  const navOk = check(fetchRes, {
    "Layout fetch returns 200": (r) => r.status === 200,
    "Sections array present": () => Array.isArray(sections) && sections.length > 0,
  });

  if (navOk) {
    navigationsSuccess.add(1);
  } else {
    failed = true;
  }

  const sec0 = sections?.[0];
  const sec1 = sections?.[1];
  const q0_1 = sec0?.questions?.[0]?.questionId || "q-sec0-1";
  const q0_2 = sec0?.questions?.[1]?.questionId || sec0?.questions?.[0]?.questionId || "q-sec0-2";
  const q1_1 = sec1?.questions?.[0]?.questionId || "q-sec1-1";

  sleep(0.5);

  // 4. Telemetry Pulse 1 (Heartbeat during initial reading)
  const tHb1_0 = Date.now();
  let hb1Res = postWithRetry(
    `${BASE_URL}/tests/${originalInstanceId}/heartbeat`,
    JSON.stringify({
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      answeredCount: 0,
      totalQuestions: 60,
      remainingTimeSeconds: 7200,
      networkStatus: "ONLINE",
      autosaveHealth: "HEALTHY",
      latencyMs: 100,
    }),
    { headers: authHeaders, tags: { endpoint: "heartbeat" }, timeout: "30s" }
  );
  heartbeatDuration.add(Date.now() - tHb1_0);
  trackStatus(hb1Res, "heartbeat");

  if (hb1Res.status === 200) {
    heartbeatsTotal.add(1);
  } else {
    failed = true;
  }

  sleep(0.5);

  // 5. Candidate Answers Question 1 (Initial Answer)
  const ansChoice1 = ["A", "B", "C", "D"][candidateIndex % 4];
  const tAns1_0 = Date.now();
  let ans1Res = postWithRetry(
    `${BASE_URL}/tests/${originalInstanceId}/answer`,
    JSON.stringify({
      questionId: q0_1,
      answer: ansChoice1,
      timeSpentSeconds: 25,
      isMarkedForReview: false,
    }),
    { headers: authHeaders, tags: { endpoint: "answer_save" }, timeout: "45s" }
  );
  answerDuration.add(Date.now() - tAns1_0);
  trackStatus(ans1Res, "answer_save");

  if (ans1Res.status === 200) {
    answersSavedTotal.add(1);
  } else {
    failed = true;
  }

  sleep(0.5);

  // 6. Candidate Revisits Question 1 & Changes Answer (Answer Update / Autosave Verification)
  const ansChoiceUpdated = ["B", "C", "D", "A"][candidateIndex % 4];
  const tAnsUpdate_0 = Date.now();
  let ansUpdateRes = postWithRetry(
    `${BASE_URL}/tests/${originalInstanceId}/answer`,
    JSON.stringify({
      questionId: q0_1,
      answer: ansChoiceUpdated,
      timeSpentSeconds: 40,
      isMarkedForReview: true,
    }),
    { headers: authHeaders, tags: { endpoint: "answer_update" }, timeout: "45s" }
  );
  answerDuration.add(Date.now() - tAnsUpdate_0);
  trackStatus(ansUpdateRes, "answer_update");

  if (ansUpdateRes.status === 200) {
    answerUpdatesTotal.add(1);
    answersSavedTotal.add(1);
  } else {
    failed = true;
  }

  sleep(0.5);

  // 7. Telemetry Pulse 2 (Heartbeat mid-test)
  const tHb2_0 = Date.now();
  let hb2Res = postWithRetry(
    `${BASE_URL}/tests/${originalInstanceId}/heartbeat`,
    JSON.stringify({
      currentSectionIndex: 0,
      currentQuestionIndex: 1,
      answeredCount: 1,
      totalQuestions: 60,
      remainingTimeSeconds: 7100,
      networkStatus: "ONLINE",
      autosaveHealth: "HEALTHY",
      latencyMs: 110,
    }),
    { headers: authHeaders, tags: { endpoint: "heartbeat" }, timeout: "30s" }
  );
  heartbeatDuration.add(Date.now() - tHb2_0);
  trackStatus(hb2Res, "heartbeat");

  if (hb2Res.status === 200) {
    heartbeatsTotal.add(1);
  } else {
    failed = true;
  }

  sleep(0.5);

  // 8. Section Transition: Advance from Section 0 to Section 1
  const tAdv0 = Date.now();
  let advRes = postWithRetry(
    `${BASE_URL}/tests/${originalInstanceId}/sections/advance`,
    null,
    { headers: authHeaders, tags: { endpoint: "section_advance" }, timeout: "60s" }
  );
  sectionAdvanceDuration.add(Date.now() - tAdv0);
  trackStatus(advRes, "section_advance");

  const advOk = check(advRes, {
    "Advance section returns 200": (r) => r.status === 200,
  });

  if (advOk) {
    sectionTransitionsTotal.add(1);
  } else {
    failed = true;
  }

  sleep(0.5);

  // 9. Candidate Answers Question in Section 1
  const ansChoiceSec1 = ["C", "D", "A", "B"][candidateIndex % 4];
  const tAnsSec1_0 = Date.now();
  let ansSec1Res = postWithRetry(
    `${BASE_URL}/tests/${originalInstanceId}/answer`,
    JSON.stringify({
      questionId: q1_1,
      answer: ansChoiceSec1,
      timeSpentSeconds: 35,
      isMarkedForReview: false,
    }),
    { headers: authHeaders, tags: { endpoint: "answer_sec1" }, timeout: "45s" }
  );
  answerDuration.add(Date.now() - tAnsSec1_0);
  trackStatus(ansSec1Res, "answer_sec1");

  if (ansSec1Res.status === 200) {
    answersSavedTotal.add(1);
  } else {
    failed = true;
  }

  sleep(0.5);

  // 10. Candidate Experiences Browser Disconnect & Reconnect / Resume
  // Step A: Re-start assessment to verify idempotency and instance reuse
  let restartRes = postWithRetry(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: assessmentId }),
    { headers: authHeaders, tags: { endpoint: "restart_idempotency" }, timeout: "60s" }
  );
  trackStatus(restartRes, "restart_idempotency");

  let resumedInstanceId = null;
  try {
    resumedInstanceId = restartRes.json("data.testInstanceId") || restartRes.json("testInstanceId");
  } catch (_) {}

  const resumeReuseOk = check(restartRes, {
    "Restart returns 200": (r) => r.status === 200,
    "Same instance ID maintained": () => resumedInstanceId === originalInstanceId,
  });

  if (resumeReuseOk) {
    resumesReusedTotal.add(1);
  } else {
    failed = true;
  }

  // Step B: GET /tests/:id/resume
  const tResume0 = Date.now();
  let resumeStateRes = getWithRetry(`${BASE_URL}/tests/${originalInstanceId}/resume`, {
    headers: authHeaders,
    tags: { endpoint: "session_resume" },
    timeout: "45s",
  });
  resumeDuration.add(Date.now() - tResume0);
  trackStatus(resumeStateRes, "session_resume");

  check(resumeStateRes, {
    "Resume endpoint returns 200": (r) => r.status === 200,
  });

  // 11. Telemetry Pulse 3 (Post-Resume Heartbeat)
  const tHb3_0 = Date.now();
  let hb3Res = postWithRetry(
    `${BASE_URL}/tests/${originalInstanceId}/heartbeat`,
    JSON.stringify({
      currentSectionIndex: 1,
      currentQuestionIndex: 0,
      answeredCount: 2,
      totalQuestions: 60,
      remainingTimeSeconds: 7000,
      networkStatus: "ONLINE",
      autosaveHealth: "HEALTHY",
      latencyMs: 105,
    }),
    { headers: authHeaders, tags: { endpoint: "heartbeat" }, timeout: "30s" }
  );
  heartbeatDuration.add(Date.now() - tHb3_0);
  trackStatus(hb3Res, "heartbeat");

  if (hb3Res.status === 200) {
    heartbeatsTotal.add(1);
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

  const attempted = getVal("day2_t6_candidates_attempted");
  const success = getVal("day2_t6_candidates_success");
  const failed = getVal("day2_t6_candidates_failed");
  const errRate = (data.metrics["day2_t6_error_rate"]?.values?.rate * 100 || 0).toFixed(2);

  const navs = getVal("day2_t6_navigations_success");
  const answersSaved = getVal("day2_t6_answers_saved_total");
  const answerUpdates = getVal("day2_t6_answer_updates_total");
  const heartbeats = getVal("day2_t6_heartbeats_total");
  const transitions = getVal("day2_t6_section_transitions_total");
  const resumes = getVal("day2_t6_resumes_reused_total");

  const err429 = getVal("day2_t6_errors_429");
  const err4xx = getVal("day2_t6_errors_4xx");
  const err5xx = getVal("day2_t6_errors_5xx");
  const timeouts = getVal("day2_t6_timeouts");
  const resets = getVal("day2_t6_resets");
  const eof = getVal("day2_t6_eof");

  const startLat = getLat("day2_t6_start_duration_ms");
  const fetchLat = getLat("day2_t6_fetch_duration_ms");
  const ansLat = getLat("day2_t6_answer_duration_ms");
  const hbLat = getLat("day2_t6_heartbeat_duration_ms");
  const advLat = getLat("day2_t6_advance_duration_ms");
  const resumeLat = getLat("day2_t6_resume_duration_ms");
  const totalLat = getLat("day2_t6_total_duration_ms");

  const report = `
================================================================================
# Qloax Day 2 - Test 6: Mixed Realistic 500-Candidate Workload Report
================================================================================
Generated:                  ${new Date().toISOString()}
Target Environment:         ${BASE_URL}
Assessment ID:              ${ASSESSMENT_ID}
Candidates Attempted:       ${attempted}
Successful Candidates:      ${success}
Failed Candidates:          ${failed}
Overall Error Rate:         ${errRate}%

--------------------------------------------------------------------------------
## 1. HTTP Status & Network Error Breakdown
- HTTP 429 (Rate Limited):  ${err429}
- HTTP 4xx (Client Errors): ${err4xx}
- HTTP 5xx (Server Drops):  ${err5xx}
- Timeouts:                 ${timeouts}
- Connection Resets:        ${resets}
- Stream EOF:               ${eof}

--------------------------------------------------------------------------------
## 2. Mixed Realistic Workflow Operations
- Question Navigations:     ${navs} / ${attempted} (Target: 100%)
- Answers Persisted Total:  ${answersSaved} (Target: 1,500 total, 3/candidate)
- Answer Changes / Updates: ${answerUpdates} (Target: 500 total, 1/candidate)
- Heartbeats Ingested:      ${heartbeats} (Target: 1,500 total, 3/candidate)
- Section Transitions:      ${transitions} / ${attempted} (Target: 100%)
- Resumes / State Reused:   ${resumes} / ${attempted} (Target: 100%)

--------------------------------------------------------------------------------
## 3. Sub-Flow Latency Distribution
| Flow / Sub-Operation       | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Assessment Start (/start)  | ${startLat.med.padEnd(8)} | ${startLat.p95.padEnd(8)} | ${startLat.p99.padEnd(8)} | ${startLat.max.padEnd(8)} | ${startLat.avg.padEnd(8)} |
| Layout Fetch (/tests/:id)  | ${fetchLat.med.padEnd(8)} | ${fetchLat.p95.padEnd(8)} | ${fetchLat.p99.padEnd(8)} | ${fetchLat.max.padEnd(8)} | ${fetchLat.avg.padEnd(8)} |
| Answer Autosaves (/answer)  | ${ansLat.med.padEnd(8)} | ${ansLat.p95.padEnd(8)} | ${ansLat.p99.padEnd(8)} | ${ansLat.max.padEnd(8)} | ${ansLat.avg.padEnd(8)} |
| Heartbeat (/telemetry)     | ${hbLat.med.padEnd(8)} | ${hbLat.p95.padEnd(8)} | ${hbLat.p99.padEnd(8)} | ${hbLat.max.padEnd(8)} | ${hbLat.avg.padEnd(8)} |
| Section Advance (/advance) | ${advLat.med.padEnd(8)} | ${advLat.p95.padEnd(8)} | ${advLat.p99.padEnd(8)} | ${advLat.max.padEnd(8)} | ${advLat.avg.padEnd(8)} |
| Session Resume (/resume)   | ${resumeLat.med.padEnd(8)} | ${resumeLat.p95.padEnd(8)} | ${resumeLat.p99.padEnd(8)} | ${resumeLat.max.padEnd(8)} | ${resumeLat.avg.padEnd(8)} |
| Full Candidate Flow        | ${totalLat.med.padEnd(8)} | ${totalLat.p95.padEnd(8)} | ${totalLat.p99.padEnd(8)} | ${totalLat.max.padEnd(8)} | ${totalLat.avg.padEnd(8)} |
================================================================================
`;

  return {
    stdout: report,
    "load-tests/reports/day2-test6-mixed-workload-report.md": report,
  };
}
