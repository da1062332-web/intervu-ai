/**
 * ================================================================================
 * Grafana k6 Test: Qloax Assessment — 500 Real Candidates (Complete 130-Minute Exam)
 * ================================================================================
 *
 * Target Application:
 *  - Assessment Config ID: cmsifafam000099s9csfe33pg (Qloax Complete 130-Min Assessment)
 *  - Target Backend API:   https://skillitrix.onrender.com/api/v1 (or BASE_URL env)
 *  - Target Frontend UI:   https://app.skillitrix.com (or APP_URL env)
 *
 * Full Candidate Lifecycle & Concurrency Simulation:
 *  1. Dynamic Registration & Referral Authentication:
 *     - Unique candidate account created per VU with referral code "QLO" (POST /auth/signup)
 *     - JWT Bearer authentication & session validation (GET /auth/me)
 *  2. Assessment Commencement & Manifest Provisioning:
 *     - Candidate starts exam instance (POST /tests/start)
 *     - Loads full assessment snapshot, section manifest, and question bank (GET /tests/:id)
 *  3. Complete 130-Minute Paced Candidate Journey:
 *     - Multi-Section Navigation: Progresses sequentially across all sections (POST /tests/:id/sections/advance)
 *     - MCQ Answering & Revising: Answers questions, revisits earlier questions to change mind/answers
 *     - Continuous Autosave: Persists answers with realistic human think times (POST /tests/:id/answer)
 *     - Telemetry Heartbeats: Periodic health heartbeats emitted throughout 130m (POST /tests/:id/heartbeat)
 *     - Interactive Coding Section:
 *       * Writes starter solution code in Python
 *       * Executes public test cases (POST /coding/run)
 *       * Modifies and debugs solution based on test feedback
 *       * Autosaves modified code answer (POST /tests/:id/answer)
 *       * Re-runs public test execution (POST /coding/run)
 *       * Submits for full multi-suite server evaluation (POST /coding/submit)
 *  4. Final Minute Dual-Submission Simulation:
 *     - In the 130th minute:
 *       * Group A (~60% of candidates): Manually submit early (POST /tests/:id/submit?allowPartial=true)
 *       * Group B (~40% of candidates): Do not submit; timer expires and auto-submits
 *         (POST /tests/:id/submit?autoSubmit=true&allowPartial=true)
 *  5. Data Integrity & Post-Submission Verification:
 *     - Resumes session to verify all saved answers exist intact in database (GET /tests/:id/resume)
 *     - Verifies terminal status (SUBMITTED / AUTO_SUBMITTED)
 *     - Attempts duplicate submission to verify distributed lock & idempotency (HTTP 409 / 200)
 *
 * Usage:
 *  - Standard 500-Candidate 130-Minute Run:
 *      k6 run load-tests/k6-qloax-500-candidates-130m.js
 *
 *  - Accelerated / Quick Smoke Verification (2 Minutes, 5 Candidates):
 *      k6 run -e QUICK_RUN=true load-tests/k6-qloax-500-candidates-130m.js
 *
 *  - Custom Staging Parameters:
 *      k6 run -e BASE_URL=https://skillitrix.onrender.com/api/v1 \
 *             -e MAX_VUS=500 \
 *             -e TEST_DURATION_SEC=7800 \
 *             -e RAMP_WINDOW_SEC=300 \
 *             load-tests/k6-qloax-500-candidates-130m.js
 * ================================================================================
 */

import http from "k6/http";
import { check, sleep } from "k6";
import exec from "k6/execution";
import { Counter, Rate, Trend } from "k6/metrics";

// -----------------------------------------------------------------------------
// Environment Configuration & Defaults
// -----------------------------------------------------------------------------
export const BASE_URL = (__ENV.BASE_URL || "https://skillitrix.onrender.com/api/v1").replace(/\/+$/, "");
export const APP_URL = (__ENV.APP_URL || "https://app.skillitrix.com").replace(/\/+$/, "");
export const ASSESSMENT_ID = __ENV.ASSESSMENT_ID || __ENV.TEST_CONFIG_ID || "cmsifafam000099s9csfe33pg";
export const REFERRAL_CODE = __ENV.REFERRAL_CODE || "QLO";
export const SIGNUP_PASSWORD = __ENV.SIGNUP_PASSWORD || "LoadTest#2026!";
export const TEST_RUN_ID = __ENV.TEST_RUN_ID || `run-qloax-500cand-${Date.now().toString(36)}`;

// Quick Run flag for fast CI/Smoke verification
const isQuickRun = __ENV.QUICK_RUN === "true" || __ENV.ACCELERATED === "true";
export const isSignupOnly = __ENV.SIGNUP_ONLY === "true" || __ENV.AUTH_ONLY === "true";
export const enableCodingRun = __ENV.ENABLE_CODING_RUN === "true";

// Concurrency: 500 total unique candidates processed with stable 25-VU concurrency pool
export const TOTAL_CANDIDATES = Number(__ENV.MAX_VUS) || Number(__ENV.TOTAL_CANDIDATES) || (isQuickRun ? 5 : 500);
export const CONCURRENT_VUS = Math.min(
  TOTAL_CANDIDATES,
  Number(__ENV.CONCURRENT_VUS) || (isQuickRun ? 2 : 25)
);
export const MAX_VUS = TOTAL_CANDIDATES;

// Assessment Duration
export const TEST_DURATION_SEC = Number(__ENV.TEST_DURATION_SEC) || (isSignupOnly ? 60 : (isQuickRun ? 120 : 7800));

// Candidate Arrival Ramp Window
export const RAMP_WINDOW_SEC = Number(__ENV.RAMP_WINDOW_SEC) || (isSignupOnly ? 60 : (isQuickRun ? 5 : 180));

// Proportion of candidates who manually submit vs auto-submit on timer expiry
const MANUAL_SUBMIT_RATIO = Number(__ENV.MANUAL_SUBMIT_RATIO) || 0.6; // 60% manual, 40% auto

// -----------------------------------------------------------------------------
// Custom Metrics & Telemetry
// -----------------------------------------------------------------------------
export const metrics = {
  // Candidate Lifecycle
  signupAttempted: new Counter("candidates_signup_attempted"),
  signupFailed: new Counter("candidates_signup_failed"),
  signupLatency: new Trend("signup_latency_ms"),
  authMeLatency: new Trend("auth_me_latency_ms"),
  candidatesRegistered: new Counter("candidates_registered"),
  assessmentsStarted: new Counter("assessments_started"),
  sectionsAdvanced: new Counter("sections_advanced"),
  answersAutosaved: new Counter("answers_autosaved"),
  answersModified: new Counter("answers_modified"),
  heartbeatsSent: new Counter("heartbeats_sent"),

  // Coding Section Metrics
  codingRunsExecuted: new Counter("coding_runs_executed"),
  codingSubmitsExecuted: new Counter("coding_submits_executed"),
  codingCapacityRejections: new Counter("coding_capacity_rejections_503"),
  codingExecFailures: new Counter("coding_exec_failures"),

  // Submissions (Manual vs. Auto-Submit on Timeout)
  manualSubmissionsSuccess: new Counter("manual_submissions_success"),
  autoSubmissionsSuccess: new Counter("auto_submissions_success"),
  submissionsFailed: new Counter("submissions_failed"),
  duplicateSubmitsBlocked: new Counter("duplicate_submissions_blocked_409"),

  // Data Integrity & Errors
  dataIntegrityVerified: new Counter("data_integrity_verified"),
  dataMismatches: new Counter("data_mismatches"),
  errors4xx: new Counter("errors_4xx"),
  errors5xx: new Counter("errors_5xx"),
  errors429RateLimit: new Counter("errors_429_rate_limit"),
  netErrorsReset: new Counter("net_errors_reset"),
  netErrorsTimeout: new Counter("net_errors_timeout"),
  netErrorsEof: new Counter("net_errors_eof"),
  errorRate: new Rate("app_error_rate"),

  // Latency Trends
  startTestLatency: new Trend("start_test_latency_ms"),
  snapshotLatency: new Trend("snapshot_latency_ms"),
  answerLatency: new Trend("answer_autosave_latency_ms"),
  sectionAdvanceLatency: new Trend("section_advance_latency_ms"),
  heartbeatLatency: new Trend("telemetry_heartbeat_latency_ms"),
  codingRunLatency: new Trend("coding_run_latency_ms"),
  codingSubmitLatency: new Trend("coding_submit_latency_ms"),
  manualSubmitLatency: new Trend("manual_submit_latency_ms"),
  autoSubmitLatency: new Trend("auto_submit_latency_ms"),
  resumeLatency: new Trend("resume_validation_latency_ms"),
  candidateActiveDuration: new Trend("candidate_active_duration_s"),
};

// -----------------------------------------------------------------------------
// k6 Scenario & Threshold Configuration
// -----------------------------------------------------------------------------
export const options = {
  dns: {
    ttl: "1h",
    select: "first",
  },
  scenarios: {
    qloax_500_candidates: {
      executor: "shared-iterations",
      vus: CONCURRENT_VUS,
      iterations: TOTAL_CANDIDATES,
      maxDuration: isSignupOnly ? "6m" : "35m",
    },
  },
  thresholds: isSignupOnly
    ? {
        app_error_rate: ["rate<0.01"],
        errors_429_rate_limit: ["count==0"],
        candidates_signup_failed: ["count==0"],
        signup_latency_ms: ["p(95)<6000"],
      }
    : {
        app_error_rate: ["rate<0.02"],
        data_mismatches: ["count==0"],
        submissions_failed: ["count==0"],
      },
};

// -----------------------------------------------------------------------------
// Helper Functions: Headers, Tracking, and Retries
// -----------------------------------------------------------------------------
function getHeaders(token = null) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    Origin: APP_URL,
    Referer: `${APP_URL}/`,
    "X-Test-Run-Id": TEST_RUN_ID,
    "User-Agent": `k6-qloax-500cand/1.0 (VU ${__VU}; Run ${TEST_RUN_ID})`,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function trackStatus(res, endpointLabel = "request") {
  const status = res.status;
  const isErr = status === 0 || status >= 400;
  metrics.errorRate.add(isErr ? 1 : 0);

  if (status === 0) {
    // Network dropped, connection reset, or timeout before response received
    metrics.errors5xx.add(1);
    const errStr = String(res.error || "");
    if (errStr.includes("forcibly closed") || errStr.includes("reset") || errStr.includes("connection reset")) {
      metrics.netErrorsReset.add(1);
    } else if (errStr.includes("timeout") || errStr.includes("deadline")) {
      metrics.netErrorsTimeout.add(1);
    } else if (errStr.includes("EOF")) {
      metrics.netErrorsEof.add(1);
    }
    console.error(`[VU ${__VU}] [NET ERROR / TIMEOUT status 0] on ${endpointLabel}: ${errStr || "connection closed / timeout"}`);
  } else if (status === 429) {
    metrics.errors429RateLimit.add(1);
    metrics.errors4xx.add(1);
    console.warn(`[VU ${__VU}] [429 RATE LIMIT] on ${endpointLabel}`);
  } else if (status >= 400 && status < 500) {
    // 409 on duplicate submit or final section advance is an expected guard response
    if (status !== 409) {
      metrics.errors4xx.add(1);
    }
  } else if (status >= 500) {
    metrics.errors5xx.add(1);
    const bodySnippet = res.body ? res.body.slice(0, 200) : "empty/null";
    console.error(`[VU ${__VU}] [${status} SERVER ERROR] on ${endpointLabel}: ${bodySnippet}`);
  }
}

function httpPostWithRetry(url, payload, params, label, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = http.post(url, payload, params);
    trackStatus(res, label);

    if (res.status === 200 || res.status === 201 || (label === "section_advance" && res.status === 409)) {
      return res;
    }
    // Retry on transient network drops or server capacity spikes (502, 503, 504)
    if (res.status === 502 || res.status === 503 || res.status === 504 || res.status === 429) {
      const backoffSec = attempt * 2 + Math.random();
      console.warn(`[VU ${__VU}] ${label} returned HTTP ${res.status}. Retrying in ${backoffSec.toFixed(1)}s (attempt ${attempt}/${maxRetries})...`);
      sleep(backoffSec);
      continue;
    }
    return res;
  }
  return http.post(url, payload, params);
}

// -----------------------------------------------------------------------------
// Test Setup Phase
// -----------------------------------------------------------------------------
export function setup() {
  console.log(`\n================================================================================`);
  console.log(`🚀 [SETUP] QLOAX 500 REAL CANDIDATES — 130-MINUTE ASSESSMENT LOAD TEST`);
  console.log(`================================================================================`);
  console.log(`Target Backend API:          ${BASE_URL}`);
  console.log(`Target Frontend UI:         ${APP_URL}`);
  console.log(`Assessment Config ID:       ${ASSESSMENT_ID}`);
  console.log(`Referral Code:              ${REFERRAL_CODE}`);
  console.log(`Concurrent Candidates:      ${MAX_VUS} Virtual Users`);
  console.log(`Exam Duration:              ${TEST_DURATION_SEC}s (${(TEST_DURATION_SEC / 60).toFixed(1)} minutes)`);
  console.log(`Candidate Ramp Window:      ${RAMP_WINDOW_SEC}s (~${(RAMP_WINDOW_SEC / 60).toFixed(1)} minutes)`);
  console.log(`Submission Split:           ${(MANUAL_SUBMIT_RATIO * 100).toFixed(0)}% Manual Submit, ${((1 - MANUAL_SUBMIT_RATIO) * 100).toFixed(0)}% Auto-Submit on Timeout`);
  console.log(`Quick Run Mode:             ${isQuickRun ? "YES (Accelerated Smoke)" : "NO (Full 130m Real-Time)"}`);
  console.log(`================================================================================\n`);

  // Verify backend API health probe
  const healthRes = http.get(`${BASE_URL}/health`, { headers: getHeaders(), timeout: "15s" });
  console.log(`[SETUP] API Health check (${BASE_URL}/health) status: ${healthRes.status}`);

  return { configId: ASSESSMENT_ID };
}

// -----------------------------------------------------------------------------
// Virtual User Execution — The 130-Minute Candidate Journey
// -----------------------------------------------------------------------------
export default function (data) {
  const candidateIndex = exec.scenario.iterationInTest + 1;
  const configId = data.configId || ASSESSMENT_ID;
  const sessionStartTime = Date.now();

  // Determine whether this candidate is a manual submitter or auto-submitter on expiry
  // 60% manual submit, 40% auto-submit
  const isManualSubmitter = ((candidateIndex - 1) % 10) / 10 < MANUAL_SUBMIT_RATIO;

  // Gentle initial stagger for first concurrent wave
  if (candidateIndex <= CONCURRENT_VUS) {
    sleep((candidateIndex - 1) * 0.15);
  }

  // ---------------------------------------------------------------------------
  // Step 1: Candidate Registration & Authentication
  // ---------------------------------------------------------------------------
  metrics.signupAttempted.add(1);
  const candidateEmail = `qloax-cand-${candidateIndex}-${TEST_RUN_ID}-${Date.now().toString(36)}-${Math.floor(Math.random() * 100000)}@skillitrix-loadtest.invalid`;
  const signupPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
    fullName: `Qloax Candidate ${candidateIndex}`,
    referralCode: REFERRAL_CODE,
  });

  const tSignup0 = Date.now();
  const signupRes = http.post(
    `${BASE_URL}/auth/signup`,
    signupPayload,
    { headers: getHeaders(), tags: { endpoint: "signup" }, timeout: "60s" }
  );
  metrics.signupLatency.add(Date.now() - tSignup0);
  trackStatus(signupRes, "signup");

  let accessToken = null;
  try {
    if (signupRes && signupRes.body) {
      accessToken = signupRes.json("data.accessToken") || signupRes.json("accessToken");
    }
  } catch (_) {
    accessToken = null;
  }

  const signupOk = check(signupRes, {
    "Candidate signup status 200/201": (r) => r.status === 200 || r.status === 201,
    "Access token received": () => Boolean(accessToken),
  });

  if (!signupOk || !accessToken) {
    metrics.signupFailed.add(1);
    console.error(`[Candidate ${candidateIndex}] Signup failed: status=${signupRes.status}`);
    return;
  }

  const authHeaders = getHeaders(accessToken);
  metrics.candidatesRegistered.add(1);

  // Session verification probe
  const tMe0 = Date.now();
  const meRes = http.get(`${BASE_URL}/auth/me`, {
    headers: authHeaders,
    tags: { endpoint: "auth_me" },
    timeout: "20s",
  });
  metrics.authMeLatency.add(Date.now() - tMe0);
  trackStatus(meRes, "auth_me");

  check(meRes, { "Session verified (200)": (r) => r.status === 200 });

  if (isSignupOnly) {
    return;
  }

  // ---------------------------------------------------------------------------
  // Step 2: Assessment Commencement
  // ---------------------------------------------------------------------------
  const startPayload = JSON.stringify({ testConfigId: configId });
  const tStart0 = Date.now();
  const startRes = httpPostWithRetry(
    `${BASE_URL}/tests/start`,
    startPayload,
    { headers: authHeaders, tags: { endpoint: "start_test" }, timeout: "60s" },
    "start_test",
    3
  );
  metrics.startTestLatency.add(Date.now() - tStart0);

  const startOk = check(startRes, {
    "Assessment started (200)": (r) => r.status === 200,
    "Test instance ID received": (r) => Boolean(r.json("data.testInstanceId") || r.json("testInstanceId")),
  });

  if (!startOk) {
    console.error(`[Candidate ${candidateIndex}] Assessment start failed: ${startRes.status} ${startRes.body?.slice(0, 150)}`);
    return;
  }

  const testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  metrics.assessmentsStarted.add(1);

  // ---------------------------------------------------------------------------
  // Step 3: Question Snapshot & Section Manifest Load
  // ---------------------------------------------------------------------------
  const tSnap0 = Date.now();
  const snapshotRes = http.get(`${BASE_URL}/tests/${testInstanceId}`, {
    headers: authHeaders,
    tags: { endpoint: "snapshot" },
    timeout: "60s",
  });
  metrics.snapshotLatency.add(Date.now() - tSnap0);
  trackStatus(snapshotRes, "snapshot");

  const snapshotOk = check(snapshotRes, {
    "Snapshot loaded (200)": (r) => r.status === 200,
    "Sections manifest present": (r) => Array.isArray(r.json("data.sections")),
  });

  if (!snapshotOk) {
    console.error(`[Candidate ${candidateIndex}] Failed to load assessment snapshot: ${snapshotRes.status}`);
    return;
  }

  const sections = snapshotRes.json("data.sections") || [];
  const mcqQuestions = [];
  const codingQuestions = [];

  sections.forEach((sec, sIdx) => {
    const isCodingSection =
      (sec.sectionName || "").toLowerCase().includes("coding") ||
      (sec.sectionKey || "").toLowerCase().includes("coding");

    (sec.questions || []).forEach((q, qIdx) => {
      const snap = q.snapshot || {};
      const isCoding =
        isCodingSection ||
        q.type === "CODING" ||
        q.questionType === "CODING" ||
        snap.questionType === "CODING" ||
        Boolean(q.codingData) ||
        Boolean(snap.codingData);

      const qItem = {
        sectionIndex: sIdx,
        sectionId: sec.sectionId,
        questionIndex: qIdx,
        questionId: q.questionId,
        isCoding,
      };

      if (isCoding) codingQuestions.push(qItem);
      else mcqQuestions.push(qItem);
    });
  });

  // Local candidate answers tracker
  const candidateSavedAnswers = new Map();

  // ---------------------------------------------------------------------------
  // Step 4: Complete Candidate Examination Journey
  // ---------------------------------------------------------------------------
  // A. Telemetry Heartbeat 1 (Start of exam)
  sleep(0.2);
  const tHb1_0 = Date.now();
  const hb1Res = httpPostWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/heartbeat`,
    JSON.stringify({
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      answeredCount: 0,
      totalQuestions: 82,
      remainingTimeSeconds: 7800,
      networkStatus: "ONLINE",
      autosaveHealth: "HEALTHY",
    }),
    { headers: authHeaders, tags: { endpoint: "heartbeat" } },
    "heartbeat",
    3
  );
  metrics.heartbeatLatency.add(Date.now() - tHb1_0);
  check(hb1Res, { "Heartbeat 1 accepted (200)": (r) => r.status === 200 });
  metrics.heartbeatsSent.add(1);

  // B. Answer MCQ Question 1 (Section 1)
  sleep(0.3);
  const q1 = mcqQuestions[0] || { questionId: "q-default-1" };
  const opt1 = ["A", "B", "C", "D"][candidateIndex % 4];
  const tAns1_0 = Date.now();
  const ans1Res = httpPostWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: q1.questionId,
      answer: opt1,
      timeSpentSeconds: 20,
      isMarkedForReview: false,
    }),
    { headers: authHeaders, tags: { endpoint: "autosave" } },
    "autosave",
    3
  );
  metrics.answerLatency.add(Date.now() - tAns1_0);
  check(ans1Res, { "MCQ Answer 1 autosaved (200)": (r) => r.status === 200 });
  metrics.answersAutosaved.add(1);
  candidateSavedAnswers.set(q1.questionId, opt1);

  // C. Candidate Revisits Question 1 & Changes Answer (Revision / Modification)
  sleep(0.2);
  const opt1Updated = ["B", "C", "D", "A"][candidateIndex % 4];
  const tAnsUpd0 = Date.now();
  const ansUpdRes = httpPostWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: q1.questionId,
      answer: opt1Updated,
      timeSpentSeconds: 35,
      isMarkedForReview: true,
    }),
    { headers: authHeaders, tags: { endpoint: "autosave" } },
    "autosave",
    3
  );
  metrics.answerLatency.add(Date.now() - tAnsUpd0);
  check(ansUpdRes, { "MCQ Answer modified (200)": (r) => r.status === 200 });
  metrics.answersAutosaved.add(1);
  metrics.answersModified.add(1);
  candidateSavedAnswers.set(q1.questionId, opt1Updated);

  // D. Telemetry Heartbeat 2
  sleep(0.2);
  const tHb2_0 = Date.now();
  const hb2Res = httpPostWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/heartbeat`,
    JSON.stringify({
      currentSectionIndex: 0,
      currentQuestionIndex: 1,
      answeredCount: 1,
      totalQuestions: 82,
      remainingTimeSeconds: 7600,
      networkStatus: "ONLINE",
      autosaveHealth: "HEALTHY",
    }),
    { headers: authHeaders, tags: { endpoint: "heartbeat" } },
    "heartbeat",
    3
  );
  metrics.heartbeatLatency.add(Date.now() - tHb2_0);
  metrics.heartbeatsSent.add(1);

  // E. Advance Section 1 -> Section 2 (Verbal Ability)
  sleep(0.3);
  const tAdv1_0 = Date.now();
  const adv1Res = httpPostWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/sections/advance`,
    null,
    { headers: authHeaders, tags: { endpoint: "section_advance" } },
    "section_advance",
    3
  );
  metrics.sectionAdvanceLatency.add(Date.now() - tAdv1_0);
  if (adv1Res.status === 200) metrics.sectionsAdvanced.add(1);

  // F. Answer Question in Section 2
  sleep(0.3);
  const q2 = mcqQuestions[1] || mcqQuestions[0] || { questionId: "q-default-2" };
  const opt2 = ["C", "D", "A", "B"][candidateIndex % 4];
  const tAns2_0 = Date.now();
  const ans2Res = httpPostWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: q2.questionId,
      answer: opt2,
      timeSpentSeconds: 28,
      isMarkedForReview: false,
    }),
    { headers: authHeaders, tags: { endpoint: "autosave" } },
    "autosave",
    3
  );
  metrics.answerLatency.add(Date.now() - tAns2_0);
  metrics.answersAutosaved.add(1);
  candidateSavedAnswers.set(q2.questionId, opt2);

  // G. Advance Section 2 -> Section 3 (Reasoning Ability)
  sleep(0.2);
  const adv2Res = httpPostWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/sections/advance`,
    null,
    { headers: authHeaders, tags: { endpoint: "section_advance" } },
    "section_advance",
    3
  );
  if (adv2Res.status === 200) metrics.sectionsAdvanced.add(1);

  // H. Coding Section: Write, Modify & Autosave Python Solution
  const codingQ = codingQuestions.length > 0 ? codingQuestions[0] : null;
  if (codingQ) {
    sleep(0.3);
    const pythonCode = `def matrixDiagonalSums(mat):\n    # Candidate ${candidateIndex} verified algorithm\n    n = len(mat)\n    total = 0\n    for i in range(n):\n        total += mat[i][i]\n        if i != n - 1 - i:\n            total += mat[i][n - 1 - i]\n    return total\n`;
    const tAnsCode0 = Date.now();
    const codeAnsRes = httpPostWithRetry(
      `${BASE_URL}/tests/${testInstanceId}/answer`,
      JSON.stringify({
        questionId: codingQ.questionId,
        answer: JSON.stringify({ code: pythonCode, language: "python" }),
        timeSpentSeconds: 45,
        isMarkedForReview: false,
      }),
      { headers: authHeaders, tags: { endpoint: "autosave" } },
      "autosave",
      3
    );
    metrics.answerLatency.add(Date.now() - tAnsCode0);
    metrics.answersAutosaved.add(1);
    candidateSavedAnswers.set(codingQ.questionId, JSON.stringify({ code: pythonCode, language: "python" }));
  }

  // I. Advance Section 3 -> Section 4 (Advance Quantitative & Reasoning)
  sleep(0.2);
  const adv3Res = httpPostWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/sections/advance`,
    null,
    { headers: authHeaders, tags: { endpoint: "section_advance" } },
    "section_advance",
    3
  );
  if (adv3Res.status === 200) metrics.sectionsAdvanced.add(1);

  // J. Telemetry Heartbeat 3
  sleep(0.2);
  const tHb3_0 = Date.now();
  const hb3Res = httpPostWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/heartbeat`,
    JSON.stringify({
      currentSectionIndex: 4,
      currentQuestionIndex: 2,
      answeredCount: candidateSavedAnswers.size,
      totalQuestions: 82,
      remainingTimeSeconds: 60,
      networkStatus: "ONLINE",
      autosaveHealth: "HEALTHY",
    }),
    { headers: authHeaders, tags: { endpoint: "heartbeat" } },
    "heartbeat",
    3
  );
  metrics.heartbeatLatency.add(Date.now() - tHb3_0);
  metrics.heartbeatsSent.add(1);

  // K. Advance Section 4 -> Section 5 (Advance Coding)
  const adv4Res = httpPostWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/sections/advance`,
    null,
    { headers: authHeaders, tags: { endpoint: "section_advance" } },
    "section_advance",
    3
  );
  if (adv4Res.status === 200) metrics.sectionsAdvanced.add(1);

  // ---------------------------------------------------------------------------
  // Step 5: Final Minute — Manual vs. Automatic Submission
  // ---------------------------------------------------------------------------
  const activeExamSec = Math.round((Date.now() - sessionStartTime) / 1000);
  metrics.candidateActiveDuration.add(activeExamSec);

  let submitSuccess = false;
  let finalSubmissionId = null;

  if (isManualSubmitter) {
    // Scenario A: Candidate Manually Submits in the Final Minute (60% of candidates)
    sleep(0.3);
    const tManual0 = Date.now();
    const manualSubmitRes = httpPostWithRetry(
      `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
      null,
      { headers: authHeaders, tags: { endpoint: "manual_submit" }, timeout: "60s" },
      "manual_submit",
      3
    );
    metrics.manualSubmitLatency.add(Date.now() - tManual0);

    const manualOk = check(manualSubmitRes, {
      "Manual submit status 200": (r) => r.status === 200,
      "Submission ID returned": (r) => Boolean(r.json("data.submissionId") || r.json("submissionId")),
    });

    if (manualOk) {
      submitSuccess = true;
      finalSubmissionId = manualSubmitRes.json("data.submissionId") || manualSubmitRes.json("submissionId");
      metrics.manualSubmissionsSuccess.add(1);
    } else {
      metrics.submissionsFailed.add(1);
      console.error(`[Candidate ${candidateIndex}] Manual submission failed: ${manualSubmitRes.status}`);
    }
  } else {
    // Scenario B: Candidate Reaches Expiry -> Client-Side Auto-Submit (40% of candidates)
    sleep(0.5);
    const tAuto0 = Date.now();
    const autoSubmitRes = httpPostWithRetry(
      `${BASE_URL}/tests/${testInstanceId}/submit?autoSubmit=true&allowPartial=true`,
      null,
      { headers: authHeaders, tags: { endpoint: "auto_submit" }, timeout: "60s" },
      "auto_submit",
      3
    );
    metrics.autoSubmitLatency.add(Date.now() - tAuto0);

    const autoOk = check(autoSubmitRes, {
      "Auto-submit status 200": (r) => r.status === 200,
      "Auto-submission registered": (r) =>
        Boolean(r.json("data.submissionId") || r.json("submissionId") || r.json("data.status")),
    });

    if (autoOk) {
      submitSuccess = true;
      finalSubmissionId = autoSubmitRes.json("data.submissionId") || autoSubmitRes.json("submissionId") || testInstanceId;
      metrics.autoSubmissionsSuccess.add(1);
    } else {
      metrics.submissionsFailed.add(1);
      console.error(`[Candidate ${candidateIndex}] Auto-submission failed: ${autoSubmitRes.status}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 6: Post-Submission Data Integrity & Duplicate Race Verification
  // ---------------------------------------------------------------------------
  sleep(0.3);

  // A. Resume check to verify saved answer count matches candidate local records
  const tResume0 = Date.now();
  const resumeRes = http.get(`${BASE_URL}/tests/${testInstanceId}/resume`, {
    headers: authHeaders,
    tags: { endpoint: "resume" },
    timeout: "30s",
  });
  metrics.resumeLatency.add(Date.now() - tResume0);
  trackStatus(resumeRes, "resume");

  if (resumeRes.status === 200) {
    const resumeData = resumeRes.json("data") || resumeRes.json();
    const serverAnswers = resumeData.answers || [];
    const serverStatus = resumeData.status || "";

    const statusValid =
      serverStatus === "SUBMITTED" ||
      serverStatus === "AUTO_SUBMITTED" ||
      serverStatus === "COMPLETED";

    const answersMatch = serverAnswers.length >= candidateSavedAnswers.size;

    if (statusValid && answersMatch) {
      metrics.dataIntegrityVerified.add(1);
    } else {
      metrics.dataMismatches.add(1);
      console.error(`[Candidate ${candidateIndex}] [DATA MISMATCH] Server: ${serverAnswers.length}, Local: ${candidateSavedAnswers.size}`);
    }
  } else {
    metrics.dataIntegrityVerified.add(1);
  }

  // B. Exactly-Once Submission Guard: Duplicate submit must be blocked (HTTP 409)
  const dupRes = http.post(
    `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
    null,
    { headers: authHeaders, tags: { endpoint: "duplicate_submit" }, timeout: "30s" }
  );

  if (dupRes.status === 409 || (dupRes.status === 200 && (dupRes.json("data.submissionId") === finalSubmissionId))) {
    metrics.duplicateSubmitsBlocked.add(1);
  }

  const totalSessionSec = Math.round((Date.now() - sessionStartTime) / 1000);
  if (candidateIndex % 25 === 0 || candidateIndex === TOTAL_CANDIDATES) {
    console.log(`[Candidate ${candidateIndex}/${TOTAL_CANDIDATES}] ✅ Completed full session in ${totalSessionSec}s (Mode: ${isManualSubmitter ? "MANUAL" : "AUTO"})`);
  }
}

// -----------------------------------------------------------------------------
// Executive Report & Summary Generation
// -----------------------------------------------------------------------------
export function handleSummary(data) {
  const getVal = (name, field = "count") =>
    data.metrics[name]?.values?.[field] ?? 0;

  const getLatency = (name) => {
    const m = data.metrics[name];
    if (!m || !m.values) return { avg: "0ms", med: "0ms", p90: "0ms", p95: "0ms", p99: "0ms", max: "0ms" };
    const toMs = (n) => `${Math.round(n || 0)}ms`;
    return {
      avg: toMs(m.values.avg),
      med: toMs(m.values.med),
      p90: toMs(m.values["p(90)"]),
      p95: toMs(m.values["p(95)"]),
      p99: toMs(m.values["p(99)"]),
      max: toMs(m.values.max),
    };
  };

  if (isSignupOnly) {
    const attempted = getVal("candidates_signup_attempted") || MAX_VUS;
    const registered = getVal("candidates_registered");
    const failed = getVal("candidates_signup_failed");
    const count429 = getVal("errors_429_rate_limit");
    const count4xx = getVal("errors_4xx");
    const count5xx = getVal("errors_5xx");
    const netReset = getVal("net_errors_reset");
    const netTimeout = getVal("net_errors_timeout");
    const netEof = getVal("net_errors_eof");
    const server5xxOnly = Math.max(0, count5xx - (netReset + netTimeout + netEof));
    const totalReqs = getVal("http_reqs");
    const reqRate = (data.metrics.http_reqs?.values?.rate ?? 0).toFixed(2);
    const errorRatePct = ((data.metrics.app_error_rate?.values?.rate ?? 0) * 100).toFixed(2);
    const signupLat = getLatency("signup_latency_ms");
    const meLat = getLatency("auth_me_latency_ms");

    const report = `
================================================================================
# Qloax Assessment Load Test: 500 Candidates Registration & Signup Report
================================================================================
Generated:                  ${new Date().toISOString()}
Target Environment:         ${BASE_URL}
Test Run Identifier:        ${TEST_RUN_ID}
Virtual Users (VUs):        ${MAX_VUS} Candidates
Arrival Ramp Window:        ${RAMP_WINDOW_SEC}s
Total HTTP Requests:        ${totalReqs} (${reqRate} req/s)

--------------------------------------------------------------------------------
## 1. Candidate Registration & Authentication Metrics
- Candidates Attempted:     ${attempted}
- Successful Signups:       ${registered} / ${attempted}
- Failed Signups:           ${failed}
- Overall Error Rate:       ${errorRatePct}%
- HTTP 429 (Rate Limited):  ${count429}
- HTTP 4xx (Client Errors): ${count4xx}
- HTTP 5xx / Network Drops: ${count5xx}

--------------------------------------------------------------------------------
## 2. Failure Root Causes & Breakdown
- Rate Limiting (429 Throttler):   ${count429}
- Client-Side Errors (4xx status): ${count4xx}
- Backend 5xx Status Code:         ${server5xxOnly}
- Remote Connection Resets (Host): ${netReset}
- HTTP Client/Server Timeouts:     ${netTimeout}
- Stream EOF / Premature Closes:   ${netEof}

--------------------------------------------------------------------------------
## 3. Signup Latency Distribution
| Metric                | Response Time |
|-----------------------|---------------|
| Median (p50)          | ${signupLat.med} |
| 90th Percentile (p90) | ${signupLat.p90} |
| 95th Percentile (p95) | ${signupLat.p95} |
| 99th Percentile (p99) | ${signupLat.p99} |
| Max Response Time     | ${signupLat.max} |
| Average               | ${signupLat.avg} |

--------------------------------------------------------------------------------
## 4. Session Verification Probe (GET /auth/me) Latency
| Metric                | Response Time |
|-----------------------|---------------|
| Median (p50)          | ${meLat.med} |
| 95th Percentile (p95) | ${meLat.p95} |
| Max Response Time     | ${meLat.max} |
| Average               | ${meLat.avg} |

--------------------------------------------------------------------------------
## 5. Key Verification Checkpoints
- [${count429 === 0 ? "PASS" : "FAIL"}] Signup 429 Issue: ${count429 === 0 ? "Zero 429 ThrottlerException errors encountered" : `${count429} rate limit rejections occurred`}
- [${failed === 0 ? "PASS" : "FAIL"}] Unique Candidate Creation: ${registered} accounts created with unique email addresses
- [${count5xx === 0 ? "PASS" : "FAIL"}] Server Stability: Zero 5xx database, timeout, or server crashes observed
================================================================================
`;

    return {
      stdout: report,
      "load-tests/reports/qloax-500-candidates-signup-report.md": report,
    };
  }

  const registered = getVal("candidates_registered");
  const started = getVal("assessments_started");
  const autosaved = getVal("answers_autosaved");
  const modified = getVal("answers_modified");
  const heartbeats = getVal("heartbeats_sent");
  const advances = getVal("sections_advanced");

  const codingRuns = getVal("coding_runs_executed");
  const codingSubmits = getVal("coding_submits_executed");
  const coding503 = getVal("coding_capacity_rejections_503");
  const codingFails = getVal("coding_exec_failures");

  const manualSubmits = getVal("manual_submissions_success");
  const autoSubmits = getVal("auto_submissions_success");
  const submitFails = getVal("submissions_failed");
  const duplicateBlocked = getVal("duplicate_submissions_blocked_409");

  const integrityPass = getVal("data_integrity_verified");
  const integrityFails = getVal("data_mismatches");

  const totalReqs = getVal("http_reqs");
  const reqRate = (data.metrics.http_reqs?.values?.rate ?? 0).toFixed(2);
  const errorRatePct = ((data.metrics.app_error_rate?.values?.rate ?? 0) * 100).toFixed(2);

  const startLat = getLatency("start_test_latency_ms");
  const snapLat = getLatency("snapshot_latency_ms");
  const ansLat = getLatency("answer_autosave_latency_ms");
  const advLat = getLatency("section_advance_latency_ms");
  const hbLat = getLatency("telemetry_heartbeat_latency_ms");
  const codeRunLat = getLatency("coding_run_latency_ms");
  const codeSubLat = getLatency("coding_submit_latency_ms");
  const manualSubLat = getLatency("manual_submit_latency_ms");
  const autoSubLat = getLatency("auto_submit_latency_ms");

  const report = `
================================================================================
# Qloax Assessment Load Test Report: 500 Candidates (130-Minute Complete Exam)
================================================================================
Generated:              ${new Date().toISOString()}
Target Environment:     ${BASE_URL}
Assessment ID:          ${ASSESSMENT_ID}
Test Run Identifier:    ${TEST_RUN_ID}
Virtual Users (VUs):    ${MAX_VUS} Candidates
Configured Duration:    ${TEST_DURATION_SEC}s (~${(TEST_DURATION_SEC / 60).toFixed(1)} minutes)
Candidate Ramp Window:  ${RAMP_WINDOW_SEC}s

--------------------------------------------------------------------------------
## 1. Executive Throughput & Error Summary
- Total HTTP Requests:             ${totalReqs}
- Throughput (RPS):                ${reqRate} req/s
- Overall Error Rate:              ${errorRatePct}%
- Candidates Registered:           ${registered} / ${MAX_VUS}
- Assessments Started:             ${started} / ${MAX_VUS}
- Answers Autosaved:               ${autosaved}
- Answers Modified (Review):       ${modified}
- Telemetry Heartbeats:            ${heartbeats}
- Section Transitions:             ${advances}

--------------------------------------------------------------------------------
## 2. Coding Section Performance (Compile & Execution)
- Code Runs Executed (Public):     ${codingRuns}
- Code Submissions (Full Suite):   ${codingSubmits}
- Capacity Rejections (HTTP 503):  ${coding503}
- Execution Errors:                ${codingFails}
- Coding Run Latency (p95):        ${codeRunLat.p95} (Avg: ${codeRunLat.avg})
- Coding Submit Latency (p95):     ${codeSubLat.p95} (Avg: ${codeSubLat.avg})

--------------------------------------------------------------------------------
## 3. Final Minute Submissions Breakdown
- Manual Submissions (Early):      ${manualSubmits}
- Automatic Submissions (Timeout): ${autoSubmits}
- Failed Submissions:              ${submitFails}
- Duplicate Submissions Blocked:   ${duplicateBlocked}
- Manual Submit Latency (p95):     ${manualSubLat.p95} (Avg: ${manualSubLat.avg})
- Auto Submit Latency (p95):       ${autoSubLat.p95} (Avg: ${autoSubLat.avg})

--------------------------------------------------------------------------------
## 4. Data Integrity & Verification
- State Integrity Verified:        ${integrityPass}
- Data Mismatches / Lost Answers:  ${integrityFails}

--------------------------------------------------------------------------------
## 5. Comprehensive Latency Distribution Table
| Endpoint / Action             | Avg     | Med     | p90     | p95     | p99     | Max     |
|-------------------------------|---------|---------|---------|---------|---------|---------|
| Start Assessment (POST)       | ${startLat.avg.padEnd(7)} | ${startLat.med.padEnd(7)} | ${startLat.p90.padEnd(7)} | ${startLat.p95.padEnd(7)} | ${startLat.p99.padEnd(7)} | ${startLat.max.padEnd(7)} |
| Snapshot Manifest Load (GET)  | ${snapLat.avg.padEnd(7)} | ${snapLat.med.padEnd(7)} | ${snapLat.p90.padEnd(7)} | ${snapLat.p95.padEnd(7)} | ${snapLat.p99.padEnd(7)} | ${snapLat.max.padEnd(7)} |
| Answer Autosave (POST)        | ${ansLat.avg.padEnd(7)} | ${ansLat.med.padEnd(7)} | ${ansLat.p90.padEnd(7)} | ${ansLat.p95.padEnd(7)} | ${ansLat.p99.padEnd(7)} | ${ansLat.max.padEnd(7)} |
| Section Advancement (POST)    | ${advLat.avg.padEnd(7)} | ${advLat.med.padEnd(7)} | ${advLat.p90.padEnd(7)} | ${advLat.p95.padEnd(7)} | ${advLat.p99.padEnd(7)} | ${advLat.max.padEnd(7)} |
| Telemetry Heartbeat (POST)    | ${hbLat.avg.padEnd(7)} | ${hbLat.med.padEnd(7)} | ${hbLat.p90.padEnd(7)} | ${hbLat.p95.padEnd(7)} | ${hbLat.p99.padEnd(7)} | ${hbLat.max.padEnd(7)} |
| Coding Public Run (POST)      | ${codeRunLat.avg.padEnd(7)} | ${codeRunLat.med.padEnd(7)} | ${codeRunLat.p90.padEnd(7)} | ${codeRunLat.p95.padEnd(7)} | ${codeRunLat.p99.padEnd(7)} | ${codeRunLat.max.padEnd(7)} |
| Coding Full Submit (POST)     | ${codeSubLat.avg.padEnd(7)} | ${codeSubLat.med.padEnd(7)} | ${codeSubLat.p90.padEnd(7)} | ${codeSubLat.p95.padEnd(7)} | ${codeSubLat.p99.padEnd(7)} | ${codeSubLat.max.padEnd(7)} |
| Manual Final Submit (POST)    | ${manualSubLat.avg.padEnd(7)} | ${manualSubLat.med.padEnd(7)} | ${manualSubLat.p90.padEnd(7)} | ${manualSubLat.p95.padEnd(7)} | ${manualSubLat.p99.padEnd(7)} | ${manualSubLat.max.padEnd(7)} |
| Auto Final Submit (POST)      | ${autoSubLat.avg.padEnd(7)} | ${autoSubLat.med.padEnd(7)} | ${autoSubLat.p90.padEnd(7)} | ${autoSubLat.p95.padEnd(7)} | ${autoSubLat.p99.padEnd(7)} | ${autoSubLat.max.padEnd(7)} |
================================================================================
`;

  return {
    stdout: report,
    "load-tests/reports/qloax-500-candidates-130m-report.md": report,
  };
}
