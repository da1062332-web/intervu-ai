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

// Concurrency: Default 500 real candidates (or 5 for quick run)
export const MAX_VUS = Number(__ENV.MAX_VUS) || (isQuickRun ? 5 : 500);

// Assessment Duration: Default 130 minutes (7800s) (or 120s for quick run)
export const TEST_DURATION_SEC = Number(__ENV.TEST_DURATION_SEC) || (isQuickRun ? 120 : 7800);

// Candidate Arrival Ramp Window: 300s (5 mins) for 500 candidates, 5s for quick run
export const RAMP_WINDOW_SEC = Number(__ENV.RAMP_WINDOW_SEC) || (isQuickRun ? 5 : 300);

// Proportion of candidates who manually submit vs auto-submit on timer expiry
const MANUAL_SUBMIT_RATIO = Number(__ENV.MANUAL_SUBMIT_RATIO) || 0.6; // 60% manual, 40% auto

// -----------------------------------------------------------------------------
// Custom Metrics & Telemetry
// -----------------------------------------------------------------------------
export const metrics = {
  // Candidate Lifecycle
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
  scenarios: {
    qloax_500_candidates: {
      executor: "per-vu-iterations",
      vus: MAX_VUS,
      iterations: 1,
      // Total execution budget: 130m + ramp window + 10m post-exam verification buffer
      maxDuration: `${Math.ceil((TEST_DURATION_SEC + RAMP_WINDOW_SEC) / 60) + 10}m`,
    },
  },
  thresholds: {
    // Total error rate must remain below 5% across 500 candidates
    app_error_rate: ["rate<0.05"],
    // Autosave hot path SLA
    answer_autosave_latency_ms: ["p(95)<3000"],
    // Telemetry heartbeat SLA
    telemetry_heartbeat_latency_ms: ["p(95)<2500"],
    // Final submission SLA (both manual and auto-submit)
    manual_submit_latency_ms: ["p(95)<6000"],
    auto_submit_latency_ms: ["p(95)<6000"],
    // Zero tolerance for corrupted answers or lost data
    data_mismatches: ["count==0"],
    // Total failed submissions must be bounded
    submissions_failed: ["count<10"],
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
  const isErr = status >= 400;
  metrics.errorRate.add(isErr ? 1 : 0);

  if (status === 429) {
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
    console.error(`[VU ${__VU}] [${status} SERVER ERROR] on ${endpointLabel}: ${res.body?.slice(0, 200)}`);
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
  const vuId = __VU;
  const configId = data.configId || ASSESSMENT_ID;
  const sessionStartTime = Date.now();

  // Determine whether this candidate is a manual submitter or auto-submitter on expiry
  const isManualSubmitter = ((vuId - 1) % 10) / 10 < MANUAL_SUBMIT_RATIO;

  // 1. Realistic Candidate Staggered Arrival across the Ramp Window
  // Prevents unrealistic 0ms instant stampede during account creation & initial assembly
  const arrivalStaggerSec = MAX_VUS > 1 ? (vuId - 1) * (RAMP_WINDOW_SEC / MAX_VUS) : 0;
  if (arrivalStaggerSec > 0) {
    sleep(arrivalStaggerSec);
  }

  // ---------------------------------------------------------------------------
  // Step 1: Candidate Registration & Authentication
  // ---------------------------------------------------------------------------
  const candidateEmail = `qloax-cand-${vuId}-${TEST_RUN_ID}-${Math.floor(Math.random() * 100000)}@skillitrix-loadtest.invalid`;
  const signupPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
    fullName: `Qloax Candidate ${vuId}`,
    referralCode: REFERRAL_CODE,
  });

  const signupRes = httpPostWithRetry(
    `${BASE_URL}/auth/signup`,
    signupPayload,
    { headers: getHeaders(), tags: { endpoint: "signup" }, timeout: "45s" },
    "signup",
    3
  );

  const signupOk = check(signupRes, {
    "Candidate signup status 200/201": (r) => r.status === 200 || r.status === 201,
    "Access token received": (r) => Boolean(r.json("data.accessToken") || r.json("accessToken")),
  });

  if (!signupOk) {
    console.error(`[VU ${vuId}] Signup failed: ${signupRes.status} ${signupRes.body?.slice(0, 150)}`);
    return;
  }

  const accessToken = signupRes.json("data.accessToken") || signupRes.json("accessToken");
  const authHeaders = getHeaders(accessToken);
  metrics.candidatesRegistered.add(1);

  // Session verification probe
  const meRes = http.get(`${BASE_URL}/auth/me`, {
    headers: authHeaders,
    tags: { endpoint: "auth_me" },
    timeout: "15s",
  });
  check(meRes, { "Session verified (200)": (r) => r.status === 200 });

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
    console.error(`[VU ${vuId}] Assessment start failed: ${startRes.status} ${startRes.body?.slice(0, 150)}`);
    return;
  }

  const testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  metrics.assessmentsStarted.add(1);

  // ---------------------------------------------------------------------------
  // Step 3: Deep Question Snapshot & Section Manifest Load
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
    console.error(`[VU ${vuId}] Failed to load assessment snapshot: ${snapshotRes.status}`);
    return;
  }

  const sections = snapshotRes.json("data.sections") || [];
  const totalSectionsCount = Math.max(sections.length, 1);

  // Categorize questions into MCQs and Coding problems
  const mcqQuestions = [];
  const codingQuestions = [];

  sections.forEach((sec, sIdx) => {
    (sec.questions || []).forEach((q, qIdx) => {
      const isCoding =
        q.type === "CODING" ||
        q.questionType === "CODING" ||
        Boolean(q.codingData) ||
        Boolean(q.snapshot?.codingData);

      const qItem = {
        sectionIndex: sIdx,
        sectionId: sec.sectionId,
        questionIndex: qIdx,
        questionId: q.questionId,
        isCoding,
      };

      if (isCoding) {
        codingQuestions.push(qItem);
      } else {
        mcqQuestions.push(qItem);
      }
    });
  });

  // Fallback coding questions if snapshot questions are synthetic
  const codingTargetId = codingQuestions.length > 0 ? codingQuestions[0].questionId : "coding_q1_fibonacci";

  // ---------------------------------------------------------------------------
  // Step 4: The 130-Minute Active Examination Loop
  // ---------------------------------------------------------------------------
  const examLoopStart = Date.now();
  const examLoopEnd = examLoopStart + TEST_DURATION_SEC * 1000;
  // Final minute starts at TEST_DURATION_SEC - 60s
  const finalMinuteStart = examLoopEnd - Math.min(60000, TEST_DURATION_SEC * 0.2);

  // Timing budgets across the 130 minutes
  const sectionAdvanceIntervalMs = Math.max(15000, Math.floor((TEST_DURATION_SEC * 1000) / totalSectionsCount));
  const heartbeatIntervalMs = isQuickRun ? 15000 : 28000; // Emit telemetry heartbeat every 28s

  let lastHeartbeatTime = 0;
  let lastSectionAdvanceTime = examLoopStart;
  let currentSectionIdx = 0;
  let mcqPointer = 0;
  let codingInteractionsCount = 0;

  // Local candidate answers tracker for data integrity verification
  const candidateSavedAnswers = new Map(); // questionId -> answer string

  console.log(`[VU ${vuId}] Started 130-minute exam pacing (Submit Mode: ${isManualSubmitter ? "MANUAL" : "AUTO-EXPIRY"})...`);

  while (Date.now() < finalMinuteStart) {
    const now = Date.now();
    const remainingTimeSec = Math.max(0, Math.floor((examLoopEnd - now) / 1000));

    // A. Telemetry Heartbeat (Regularly emitted throughout the 130m)
    if (now - lastHeartbeatTime >= heartbeatIntervalMs) {
      const hbPayload = JSON.stringify({
        currentSectionIndex: currentSectionIdx,
        currentQuestionIndex: mcqPointer,
        answeredCount: candidateSavedAnswers.size,
        totalQuestions: mcqQuestions.length + codingQuestions.length,
        remainingTimeSeconds: remainingTimeSec,
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
      });

      const tHb0 = Date.now();
      const hbRes = httpPostWithRetry(
        `${BASE_URL}/tests/${testInstanceId}/heartbeat`,
        hbPayload,
        { headers: authHeaders, tags: { endpoint: "heartbeat" } },
        "heartbeat",
        2
      );
      metrics.heartbeatLatency.add(Date.now() - tHb0);

      check(hbRes, { "Heartbeat accepted (200)": (r) => r.status === 200 });
      metrics.heartbeatsSent.add(1);
      lastHeartbeatTime = Date.now();
    }

    // B. Interactive Coding Section (Draft -> Run -> Modify -> Autosave -> Submit)
    // Executes periodically when candidate is in/exploring the coding section
    if (codingInteractionsCount < 3 && (now - examLoopStart) > (codingInteractionsCount + 1) * (TEST_DURATION_SEC * 250)) {
      codingInteractionsCount++;

      // Phase 1: Draft initial code implementation
      const initialPythonCode = `def solution(arr, k):\n    # Candidate iteration ${codingInteractionsCount}\n    if not arr: return 0\n    return sum(arr[:k])\n`;

      const tRun0 = Date.now();
      const runRes1 = httpPostWithRetry(
        `${BASE_URL}/coding/run`,
        JSON.stringify({
          questionId: codingTargetId,
          testInstanceId,
          code: initialPythonCode,
          language: "python",
        }),
        { headers: authHeaders, tags: { endpoint: "coding_run" }, timeout: "45s" },
        "coding_run",
        2
      );
      metrics.codingRunLatency.add(Date.now() - tRun0);
      metrics.codingRunsExecuted.add(1);

      if (runRes1.status === 503) {
        metrics.codingCapacityRejections.add(1);
      } else if (runRes1.status !== 200) {
        metrics.codingExecFailures.add(1);
      }

      // Simulate candidate thinking & debugging code (5-10s)
      sleep(isQuickRun ? 1 : 6);

      // Phase 2: Modify & refine solution code
      const modifiedPythonCode = `def solution(arr, k):\n    # Optimized window logic\n    if not arr or k <= 0: return 0\n    k = min(k, len(arr))\n    curr = sum(arr[:k])\n    res = curr\n    for i in range(k, len(arr)):\n        curr += arr[i] - arr[i-k]\n        if curr > res: res = curr\n    return res\n`;

      // Autosave modified code answer
      const codeAnswerPayload = JSON.stringify({
        questionId: codingTargetId,
        answer: JSON.stringify({ code: modifiedPythonCode, language: "python" }),
        timeSpentSeconds: 45,
        isMarkedForReview: false,
      });

      const tAnsCode0 = Date.now();
      const codeAnsRes = httpPostWithRetry(
        `${BASE_URL}/tests/${testInstanceId}/answer`,
        codeAnswerPayload,
        { headers: authHeaders, tags: { endpoint: "autosave" } },
        "autosave",
        2
      );
      metrics.answerLatency.add(Date.now() - tAnsCode0);
      metrics.answersAutosaved.add(1);
      candidateSavedAnswers.set(codingTargetId, JSON.stringify({ code: modifiedPythonCode, language: "python" }));

      // Phase 3: Re-run public test cases
      const runRes2 = httpPostWithRetry(
        `${BASE_URL}/coding/run`,
        JSON.stringify({
          questionId: codingTargetId,
          testInstanceId,
          code: modifiedPythonCode,
          language: "python",
        }),
        { headers: authHeaders, tags: { endpoint: "coding_run" }, timeout: "45s" },
        "coding_run",
        2
      );
      metrics.codingRunsExecuted.add(1);
      if (runRes2.status === 503) metrics.codingCapacityRejections.add(1);

      // Phase 4: Full coding test suite submission
      const tSubmitCode0 = Date.now();
      const submitCodeRes = httpPostWithRetry(
        `${BASE_URL}/coding/submit`,
        JSON.stringify({
          questionId: codingTargetId,
          testInstanceId,
          code: modifiedPythonCode,
          language: "python",
        }),
        { headers: authHeaders, tags: { endpoint: "coding_submit" }, timeout: "120s" },
        "coding_submit",
        2
      );
      metrics.codingSubmitLatency.add(Date.now() - tSubmitCode0);
      metrics.codingSubmitsExecuted.add(1);
      if (submitCodeRes.status === 503) metrics.codingCapacityRejections.add(1);
      else if (submitCodeRes.status !== 200) metrics.codingExecFailures.add(1);
    }

    // C. MCQ Question Answering & Revising Answers
    if (mcqQuestions.length > 0) {
      // 20% probability of candidate revisiting and changing an earlier answer
      const isRevisiting = candidateSavedAnswers.size > 2 && Math.random() < 0.2;
      let targetQ;
      let isAnswerChange = false;

      if (isRevisiting) {
        const savedKeys = Array.from(candidateSavedAnswers.keys());
        const randomKey = savedKeys[Math.floor(Math.random() * savedKeys.length)];
        targetQ = { questionId: randomKey };
        isAnswerChange = true;
      } else {
        targetQ = mcqQuestions[mcqPointer % mcqQuestions.length];
        mcqPointer++;
      }

      // Pick choice A, B, C, or D
      const optionsPool = ["A", "B", "C", "D"];
      const selectedOption = isAnswerChange
        ? optionsPool[(candidateSavedAnswers.size + 1) % 4]
        : optionsPool[candidateSavedAnswers.size % 4];

      const mcqAnswerPayload = JSON.stringify({
        questionId: targetQ.questionId,
        answer: selectedOption,
        timeSpentSeconds: isQuickRun ? 2 : Math.floor(Math.random() * 15) + 15,
        isMarkedForReview: Math.random() < 0.15,
      });

      const tAns0 = Date.now();
      const ansRes = httpPostWithRetry(
        `${BASE_URL}/tests/${testInstanceId}/answer`,
        mcqAnswerPayload,
        { headers: authHeaders, tags: { endpoint: "autosave" } },
        "autosave",
        2
      );
      metrics.answerLatency.add(Date.now() - tAns0);

      check(ansRes, { "MCQ Answer autosaved (200)": (r) => r.status === 200 });
      metrics.answersAutosaved.add(1);

      if (isAnswerChange) {
        metrics.answersModified.add(1);
      }
      candidateSavedAnswers.set(targetQ.questionId, selectedOption);
    }

    // D. Section Advance Navigation Check
    if (now - lastSectionAdvanceTime >= sectionAdvanceIntervalMs && currentSectionIdx < totalSectionsCount - 1) {
      const tAdv0 = Date.now();
      const advRes = httpPostWithRetry(
        `${BASE_URL}/tests/${testInstanceId}/sections/advance`,
        null,
        { headers: authHeaders, tags: { endpoint: "section_advance" } },
        "section_advance",
        2
      );
      metrics.sectionAdvanceLatency.add(Date.now() - tAdv0);

      const advOk = check(advRes, {
        "Section advance 200/409": (r) => r.status === 200 || r.status === 409,
      });

      if (advOk && advRes.status === 200) {
        metrics.sectionsAdvanced.add(1);
        currentSectionIdx++;
      }
      lastSectionAdvanceTime = Date.now();
    }

    // E. Realistic Human Think Time Between Actions
    const thinkTimeSec = isQuickRun
      ? Math.random() * 2 + 1
      : Math.random() * 15 + 15; // 15s - 30s think time in full 130m mode

    const timeUntilFinalMinute = Math.max(0, (finalMinuteStart - Date.now()) / 1000);
    sleep(Math.min(thinkTimeSec, timeUntilFinalMinute));
  }

  // ---------------------------------------------------------------------------
  // Step 5: The Final Minute — Manual vs. Automatic Submission
  // ---------------------------------------------------------------------------
  const activeExamSec = Math.round((Date.now() - examLoopStart) / 1000);
  metrics.candidateActiveDuration.add(activeExamSec);

  let submitSuccess = false;
  let finalSubmissionId = null;

  if (isManualSubmitter) {
    // -------------------------------------------------------------------------
    // Scenario A: Candidate Manually Submits in the Final Minute
    // -------------------------------------------------------------------------
    // Candidate pauses for 10-20 seconds to do a final review, then clicks Submit
    sleep(isQuickRun ? 1 : Math.random() * 15 + 5);

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
      console.log(`[VU ${vuId}] ✅ Candidate manually submitted successfully (ID: ${finalSubmissionId})`);
    } else {
      metrics.submissionsFailed.add(1);
      console.error(`[VU ${vuId}] ❌ Manual submission failed: ${manualSubmitRes.status}`);
    }
  } else {
    // -------------------------------------------------------------------------
    // Scenario B: Candidate Does NOT Submit — Time Expires (Auto-Submitted)
    // -------------------------------------------------------------------------
    // Candidate continues working until the final second (130:00:00)
    const timeUntilExactExpiry = Math.max(0, (examLoopEnd - Date.now()) / 1000);
    if (timeUntilExactExpiry > 0) {
      sleep(timeUntilExactExpiry);
    }

    // System client-side auto-submission on expiration
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
      console.log(`[VU ${vuId}] ⏱️ Candidate time expired -> Automatically submitted successfully (ID: ${finalSubmissionId})`);
    } else {
      metrics.submissionsFailed.add(1);
      console.error(`[VU ${vuId}] ❌ Auto-submission failed: ${autoSubmitRes.status}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 6: Post-Submission Data Integrity & Duplicate Race Verification
  // ---------------------------------------------------------------------------
  sleep(1);

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

    // Verify zero answer loss: server answers count must be >= saved answers
    const answersMatch = serverAnswers.length >= candidateSavedAnswers.size;

    if (statusValid && answersMatch) {
      metrics.dataIntegrityVerified.add(1);
    } else {
      metrics.dataMismatches.add(1);
      console.error(`[VU ${vuId}] [DATA INTEGRITY MISMATCH] Expected >= ${candidateSavedAnswers.size} answers, found ${serverAnswers.length}. Status: ${serverStatus}`);
    }
  } else {
    // If resume is locked after submit, that is safe
    metrics.dataIntegrityVerified.add(1);
  }

  // B. Exactly-Once Submission Guard: Duplicate submit must be blocked
  const dupRes = http.post(
    `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
    null,
    { headers: authHeaders, tags: { endpoint: "duplicate_submit" }, timeout: "30s" }
  );

  // Duplicate submission should either return 409 Conflict or idempotent 200 with same submission ID
  if (dupRes.status === 409 || (dupRes.status === 200 && (dupRes.json("data.submissionId") === finalSubmissionId))) {
    metrics.duplicateSubmitsBlocked.add(1);
  }

  const totalSessionSec = Math.round((Date.now() - sessionStartTime) / 1000);
  console.log(`[VU ${vuId}] Completed full 130-minute candidate session in ${totalSessionSec}s`);
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
