/**
 * Grafana k6 End-to-End Load Test: 10 Concurrent Candidates on Qloax Assessment (20 Minutes)
 *
 * Target:
 *  - Frontend UI: https://app.skillitrix.com
 *  - Backend API: https://skillitrix.onrender.com/api/v1
 *
 * Candidate Journey:
 *  1. Open UI Signup Page (https://app.skillitrix.com/signup)
 *  2. Register with unique dummy email & QLO referral code (POST /api/v1/auth/signup)
 *  3. Open Assessments Catalog UI (https://app.skillitrix.com/candidate/assessments)
 *  4. Start Qloax Assessment (POST /api/v1/tests/start)
 *  5. Open Assessment Execution UI (https://app.skillitrix.com/candidate/tests/:id/execution)
 *  6. Load Assessment Snapshot & Questions (GET /api/v1/tests/:id)
 *  7. Active 20-Minute Exam Loop:
 *     - Real-time answers saved periodically (POST /api/v1/tests/:id/answer)
 *     - Telemetry heartbeats emitted regularly (POST /api/v1/tests/:id/heartbeat)
 *     - Section transitions / advances across multiple sections (POST /api/v1/tests/:id/sections/advance)
 *  8. Submit Assessment (POST /api/v1/tests/:id/submit?allowPartial=true)
 *  9. Open Submission Summary UI (https://app.skillitrix.com/candidate/tests/:id/summary)
 *
 * Usage:
 *  Smoke test (25 seconds, 2 candidates):
 *    k6 run -e MAX_VUS=2 -e TEST_DURATION_SEC=25 -e RAMP_INTERVAL_SEC=2 load-tests/k6-qloax-e2e-20m.js
 *
 *  Full test (20 minutes, 10 candidates):
 *    k6 run -e MAX_VUS=10 -e TEST_DURATION_SEC=1200 load-tests/k6-qloax-e2e-20m.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";

// Environment configurations
const APP_URL = (__ENV.APP_URL || "https://app.skillitrix.com").replace(/\/+$/, "");
const BASE_URL = (__ENV.BASE_URL || "https://skillitrix.onrender.com/api/v1").replace(/\/+$/, "");
const REFERRAL_CODE = __ENV.REFERRAL_CODE || "QLO";
const TEST_CONFIG_ID = __ENV.TEST_CONFIG_ID || "cmsifafam000099s9csfe33pg"; // Qloax Assessment ID
const SIGNUP_PASSWORD = __ENV.SIGNUP_PASSWORD || "LoadTest#2026!";
const MAX_VUS = Number(__ENV.MAX_VUS) || 10;
const TEST_DURATION_SEC = Number(__ENV.TEST_DURATION_SEC) || 1200; // 20 minutes default (1200s)
const RAMP_INTERVAL_SEC = Number(__ENV.RAMP_INTERVAL_SEC) || 8; // Stagger candidate start by 8s per VU

// Custom Metrics
const candidatesRegistered = new Counter("candidates_registered");
const assessmentsStarted = new Counter("assessments_started");
const questionsAnswered = new Counter("questions_answered");
const heartbeatsSent = new Counter("heartbeats_sent");
const sectionsAdvanced = new Counter("sections_advanced");
const submitSuccesses = new Counter("assessment_submit_successes");
const submitFailures = new Counter("assessment_submit_failures");
const uiPageLoads = new Counter("ui_page_loads");

const answerLatency = new Trend("answer_latency_ms");
const heartbeatLatency = new Trend("heartbeat_latency_ms");
const submitLatency = new Trend("submit_latency_ms");
const candidateActiveDuration = new Trend("candidate_active_duration_s");

export const options = {
  scenarios: {
    qloax_candidates: {
      executor: "per-vu-iterations",
      vus: MAX_VUS,
      iterations: 1,
      maxDuration: `${Math.ceil((TEST_DURATION_SEC + MAX_VUS * RAMP_INTERVAL_SEC) / 60) + 5}m`,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    "http_req_duration{endpoint:answer}": ["p(95)<4500"],
    "http_req_duration{endpoint:heartbeat}": ["p(95)<4500"],
    "http_req_duration{endpoint:submit}": ["p(95)<7500"],
    assessment_submit_successes: [`count>=${MAX_VUS}`],
  },
};

// Common request headers
function getHeaders(token = null) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    Origin: APP_URL,
    Referer: `${APP_URL}/`,
    "User-Agent": `k6-qloax-loadtest/1.0 (SkillitriX UI Candidate; VU ${__VU})`,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function getUiHeaders() {
  return {
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 SkillitriX-Candidate/${__VU}`,
  };
}

/**
 * Executes an HTTP POST with exponential backoff retries for transient 502/503/504 errors.
 */
function postWithRetry(url, payload, params, label, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = http.post(url, payload, params);
    if (res.status === 200 || res.status === 201 || (label === "section_advance" && res.status === 409)) {
      return res;
    }
    if (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 429) {
      console.warn(`[VU ${__VU}] ${label} received HTTP ${res.status}. Retrying in ${attempt * 3}s (attempt ${attempt}/${maxRetries})...`);
      sleep(attempt * 3);
      continue;
    }
    return res;
  }
  return http.post(url, payload, params);
}

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[QLOAX LOAD TEST SETUP] Initiating load test`);
  console.log(`Frontend UI URL:             ${APP_URL}`);
  console.log(`Backend API URL:            ${BASE_URL}`);
  console.log(`Target Assessment Config:   ${TEST_CONFIG_ID}`);
  console.log(`Referral Code:              ${REFERRAL_CODE}`);
  console.log(`Concurrent Candidates:      ${MAX_VUS} VUs`);
  console.log(`Ramp Interval:              ${RAMP_INTERVAL_SEC}s per VU`);
  console.log(`Active Exam Duration:       ${TEST_DURATION_SEC}s (${(TEST_DURATION_SEC / 60).toFixed(1)} mins)`);
  console.log(`======================================================\n`);

  const uiRes = http.get(`${APP_URL}/signup`, { headers: getUiHeaders() });
  console.log(`[SETUP] Frontend UI probe (${APP_URL}/signup) returned HTTP ${uiRes.status}`);

  return { configId: TEST_CONFIG_ID };
}

export default function (data) {
  const vuId = __VU;
  const configId = data.configId || TEST_CONFIG_ID;
  const startTime = Date.now();

  // Stagger candidate arrival to prevent stampede during password hashing / assembly
  const arrivalStaggerSec = (vuId - 1) * RAMP_INTERVAL_SEC;
  if (arrivalStaggerSec > 0) {
    console.log(`[VU ${vuId}] Staggering arrival by ${arrivalStaggerSec}s...`);
    sleep(arrivalStaggerSec);
  }

  console.log(`[VU ${vuId}] Candidate session initiated at ${new Date().toISOString()}`);

  // -------------------------------------------------------------
  // Step 1: Candidate visits UI Signup Page
  // -------------------------------------------------------------
  const signupPageRes = http.get(`${APP_URL}/signup`, {
    headers: getUiHeaders(),
    tags: { endpoint: "ui_signup_page" },
  });
  check(signupPageRes, {
    "UI signup page loaded (200)": (r) => r.status === 200,
  });
  uiPageLoads.add(1);
  sleep(1);

  // -------------------------------------------------------------
  // Step 2: Register account with unique dummy email & QLO referral code
  // -------------------------------------------------------------
  const uniqueEmail = `qloax-cand-vu${vuId}-${Date.now()}-${Math.floor(Math.random() * 100000)}@skillitrix-loadtest.invalid`;
  const signupPayload = JSON.stringify({
    email: uniqueEmail,
    password: SIGNUP_PASSWORD,
    fullName: `Qloax Candidate VU${vuId}`,
    referralCode: REFERRAL_CODE,
  });

  const signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    signupPayload,
    { headers: getHeaders(), tags: { endpoint: "signup" } },
    "signup",
    3
  );

  const signupOk = check(signupRes, {
    "Candidate signup status is 200/201": (r) => r.status === 200 || r.status === 201,
    "Access token received": (r) => Boolean(r.json("data.accessToken") || r.json("accessToken")),
  });

  if (!signupOk) {
    console.error(`[VU ${vuId}] Signup failed: ${signupRes.status} - ${signupRes.body?.slice(0, 200)}`);
    return;
  }

  const accessToken = signupRes.json("data.accessToken") || signupRes.json("accessToken");
  candidatesRegistered.add(1);
  console.log(`[VU ${vuId}] Registered successfully (${uniqueEmail}) with referral ${REFERRAL_CODE}`);

  const authHeaders = getHeaders(accessToken);

  // -------------------------------------------------------------
  // Step 3: Candidate visits Assessments Dashboard UI
  // -------------------------------------------------------------
  const assessmentsUiRes = http.get(`${APP_URL}/candidate/assessments`, {
    headers: getUiHeaders(),
    tags: { endpoint: "ui_assessments_page" },
  });
  check(assessmentsUiRes, {
    "UI assessments page loaded (200)": (r) => r.status === 200,
  });
  uiPageLoads.add(1);
  sleep(1.5);

  // -------------------------------------------------------------
  // Step 4: Start Assessment via API
  // -------------------------------------------------------------
  const startPayload = JSON.stringify({ testConfigId: configId });
  const startRes = postWithRetry(
    `${BASE_URL}/tests/start`,
    startPayload,
    { headers: authHeaders, tags: { endpoint: "start_test" }, timeout: "60s" },
    "start_test",
    3
  );

  const startOk = check(startRes, {
    "Assessment start status is 200": (r) => r.status === 200,
    "Test instance ID generated": (r) => Boolean(r.json("data.testInstanceId") || r.json("testInstanceId")),
  });

  if (!startOk) {
    console.error(`[VU ${vuId}] Start test failed: ${startRes.status} - ${startRes.body?.slice(0, 200)}`);
    return;
  }

  const testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  assessmentsStarted.add(1);
  console.log(`[VU ${vuId}] Started assessment instance: ${testInstanceId}`);

  // -------------------------------------------------------------
  // Step 5: Candidate loads Test Execution UI & Assessment Snapshot
  // -------------------------------------------------------------
  const executionUiRes = http.get(`${APP_URL}/candidate/tests/${testInstanceId}/execution`, {
    headers: getUiHeaders(),
    tags: { endpoint: "ui_execution_page" },
  });
  check(executionUiRes, {
    "UI execution page loaded (200)": (r) => r.status === 200,
  });
  uiPageLoads.add(1);

  // Fetch full assessment snapshot and questions
  const snapshotRes = http.get(`${BASE_URL}/tests/${testInstanceId}`, {
    headers: authHeaders,
    tags: { endpoint: "snapshot" },
    timeout: "60s",
  });

  const snapshotOk = check(snapshotRes, {
    "Assessment snapshot loaded (200)": (r) => r.status === 200,
    "Sections manifest present": (r) => Array.isArray(r.json("data.sections")),
  });

  if (!snapshotOk) {
    console.error(`[VU ${vuId}] Failed to load snapshot: ${snapshotRes.status}`);
    return;
  }

  const sections = snapshotRes.json("data.sections") || [];
  console.log(`[VU ${vuId}] Loaded snapshot with ${sections.length} sections`);

  // Collect question IDs across all sections
  const questionPool = [];
  sections.forEach((sec, sIdx) => {
    (sec.questions || []).forEach((q, qIdx) => {
      questionPool.push({
        sectionIndex: sIdx,
        sectionId: sec.sectionId,
        questionIndex: qIdx,
        questionId: q.questionId,
        type: q.type || "MCQ",
      });
    });
  });

  const totalQuestions = questionPool.length || 162;
  console.log(`[VU ${vuId}] Total question pool size: ${totalQuestions}`);

  // -------------------------------------------------------------
  // Step 6: 20-Minute Sustained Exam Session Loop
  // -------------------------------------------------------------
  const examLoopStartTime = Date.now();
  const examLoopEndTime = examLoopStartTime + TEST_DURATION_SEC * 1000;

  // Plan section advance intervals (9 sections total -> advance evenly across test duration)
  const totalSections = Math.max(sections.length, 9);
  const sectionAdvanceIntervalMs = Math.max(12000, Math.floor((TEST_DURATION_SEC * 1000) / totalSections));
  let lastSectionAdvanceTime = examLoopStartTime;
  let currentSectionIdx = 0;

  let lastHeartbeatTime = 0;
  const heartbeatIntervalMs = 28000; // Emit telemetry heartbeat every ~28 seconds

  let answeredCount = 0;
  let qPointer = 0;

  console.log(`[VU ${vuId}] Entering active exam loop. Target duration: ${TEST_DURATION_SEC}s (~${(TEST_DURATION_SEC / 60).toFixed(1)} mins)`);

  while (Date.now() < examLoopEndTime) {
    const now = Date.now();
    const remainingTimeSec = Math.max(0, Math.floor((examLoopEndTime - now) / 1000));

    // A. Heartbeat & Telemetry Check
    if (now - lastHeartbeatTime >= heartbeatIntervalMs) {
      const hbPayload = JSON.stringify({
        currentSectionIndex: currentSectionIdx,
        currentQuestionIndex: qPointer,
        answeredCount: answeredCount,
        totalQuestions: totalQuestions,
        remainingTimeSeconds: remainingTimeSec,
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
      });

      const hbStart = Date.now();
      const hbRes = postWithRetry(
        `${BASE_URL}/tests/${testInstanceId}/heartbeat`,
        hbPayload,
        { headers: authHeaders, tags: { endpoint: "heartbeat" } },
        "heartbeat",
        2
      );
      heartbeatLatency.add(Date.now() - hbStart);

      check(hbRes, {
        "Heartbeat status is 200": (r) => r.status === 200,
      });
      heartbeatsSent.add(1);
      lastHeartbeatTime = Date.now();
    }

    // B. Save Answer to Current Question
    const currentQ = questionPool[qPointer % questionPool.length] || {
      questionId: `q-${qPointer}`,
    };
    const answerChoice = ["A", "B", "C", "D"][answeredCount % 4];

    const answerPayload = JSON.stringify({
      questionId: currentQ.questionId,
      answer: answerChoice,
      timeSpentSeconds: Math.floor(Math.random() * 10) + 10,
      isMarkedForReview: Math.random() < 0.1,
    });

    const ansStart = Date.now();
    const ansRes = postWithRetry(
      `${BASE_URL}/tests/${testInstanceId}/answer`,
      answerPayload,
      { headers: authHeaders, tags: { endpoint: "answer" } },
      "answer",
      2
    );
    answerLatency.add(Date.now() - ansStart);

    check(ansRes, {
      "Answer autosaved (200)": (r) => r.status === 200,
    });
    questionsAnswered.add(1);
    answeredCount++;
    qPointer++;

    // C. Section Advance Check
    if (now - lastSectionAdvanceTime >= sectionAdvanceIntervalMs) {
      const advRes = postWithRetry(
        `${BASE_URL}/tests/${testInstanceId}/sections/advance`,
        null,
        { headers: authHeaders, tags: { endpoint: "section_advance" } },
        "section_advance",
        2
      );

      const advOk = check(advRes, {
        "Section advance status 200 or 409": (r) => r.status === 200 || r.status === 409,
      });

      if (advOk) {
        sectionsAdvanced.add(1);
        currentSectionIdx++;
        console.log(`[VU ${vuId}] Section advanced -> Current section index: ${currentSectionIdx}`);
      }
      lastSectionAdvanceTime = Date.now();
    }

    // D. Realistic Candidate Think Time Between Answers (10 - 20 seconds)
    const thinkTime = TEST_DURATION_SEC < 60
      ? Math.random() * 3 + 2
      : Math.random() * 10 + 12;

    const remainingInLoop = Math.max(0, (examLoopEndTime - Date.now()) / 1000);
    sleep(Math.min(thinkTime, remainingInLoop));
  }

  const actualActiveSec = Math.round((Date.now() - examLoopStartTime) / 1000);
  candidateActiveDuration.add(actualActiveSec);
  console.log(`[VU ${vuId}] Completed active exam loop (${actualActiveSec}s active, ${answeredCount} answers saved)`);

  // -------------------------------------------------------------
  // Step 7: Final Assessment Submission
  // -------------------------------------------------------------
  console.log(`[VU ${vuId}] Submitting assessment ${testInstanceId}...`);
  const submitStart = Date.now();
  const submitRes = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
    null,
    { headers: authHeaders, tags: { endpoint: "submit" }, timeout: "60s" },
    "submit",
    3
  );
  submitLatency.add(Date.now() - submitStart);

  const submitOk = check(submitRes, {
    "Assessment submission status is 200": (r) => r.status === 200,
    "Submission registered": (r) => Boolean(r.json("data.submissionId") || r.json("submissionId")),
  });

  if (submitOk) {
    submitSuccesses.add(1);
    console.log(`[VU ${vuId}] Successfully submitted assessment! Status: ${submitRes.json("data.status") || submitRes.status}`);
  } else {
    submitFailures.add(1);
    console.error(`[VU ${vuId}] Assessment submission failed: ${submitRes.status} - ${submitRes.body?.slice(0, 200)}`);
  }

  // -------------------------------------------------------------
  // Step 8: View Submission Summary UI
  // -------------------------------------------------------------
  const summaryUiRes = http.get(`${APP_URL}/candidate/tests/${testInstanceId}/summary`, {
    headers: getUiHeaders(),
    tags: { endpoint: "ui_summary_page" },
  });
  check(summaryUiRes, {
    "UI summary page loaded (200)": (r) => r.status === 200,
  });
  uiPageLoads.add(1);

  const totalSessionSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`[VU ${vuId}] Candidate journey complete in ${totalSessionSec}s`);
}

export function handleSummary(data) {
  const vus = data.metrics.vus ? data.metrics.vus.values.max : MAX_VUS;
  const registered = data.metrics.candidates_registered ? data.metrics.candidates_registered.values.count : 0;
  const started = data.metrics.assessments_started ? data.metrics.assessments_started.values.count : 0;
  const answers = data.metrics.questions_answered ? data.metrics.questions_answered.values.count : 0;
  const heartbeats = data.metrics.heartbeats_sent ? data.metrics.heartbeats_sent.values.count : 0;
  const advances = data.metrics.sections_advanced ? data.metrics.sections_advanced.values.count : 0;
  const submits = data.metrics.assessment_submit_successes ? data.metrics.assessment_submit_successes.values.count : 0;
  const submitFails = data.metrics.assessment_submit_failures ? data.metrics.assessment_submit_failures.values.count : 0;
  const uiLoads = data.metrics.ui_page_loads ? data.metrics.ui_page_loads.values.count : 0;

  const summary = `
================================================================================
           QLOAX ASSESSMENT LOAD TEST REPORT (app.skillitrix.com)
================================================================================
Target UI URL:                 ${APP_URL}
Target Backend API:            ${BASE_URL}
Assessment ID:                 ${TEST_CONFIG_ID}
Referral Code:                 ${REFERRAL_CODE}
Configured Candidates (VUs):   ${vus}
Configured Duration:           ${TEST_DURATION_SEC}s (${(TEST_DURATION_SEC / 60).toFixed(1)} mins)

--- Execution Summary ---
Candidates Registered:         ${registered}
Assessments Started:           ${started}
UI Page Views:                 ${uiLoads}
Answers Saved:                 ${answers}
Heartbeats Emitted:            ${heartbeats}
Section Advances:              ${advances}
Submissions Succeeded:         ${submits}
Submissions Failed:            ${submitFails}

--- Latency Percentiles (p95) ---
Answer Autosave (p95):         ${data.metrics.answer_latency_ms ? data.metrics.answer_latency_ms.values['p(95)'].toFixed(1) + ' ms' : 'N/A'}
Telemetry Heartbeat (p95):     ${data.metrics.heartbeat_latency_ms ? data.metrics.heartbeat_latency_ms.values['p(95)'].toFixed(1) + ' ms' : 'N/A'}
Assessment Submit (p95):       ${data.metrics.submit_latency_ms ? data.metrics.submit_latency_ms.values['p(95)'].toFixed(1) + ' ms' : 'N/A'}
================================================================================
`;
  return {
    stdout: summary,
  };
}
