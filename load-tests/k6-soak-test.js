/**
 * Part 3 - Test 1: Qloax Soak / Endurance Test
 *
 * Runs 25–50 concurrent candidates for 2–4 hours to validate long-term platform endurance:
 * - Continuous candidate lifecycle: Signup -> Login -> Start -> Snapshot -> Answers -> Advance -> Heartbeat -> Submit
 * - Monitors for memory leaks, Redis connection exhaustion, PostgreSQL connection pool degradation
 * - Detects latency drift over prolonged multi-hour execution
 * - Validates session persistence and zero unexpected 401/403 expirations
 *
 * Environment Configs:
 * - VUS: Default 35 candidates (range 25–50)
 * - SOAK_DURATION: Default "2h" (e.g. "2h", "4h")
 * - QUICK_RUN: Set to "true" for quick 2-minute smoke verification
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter } from "k6/metrics";
import {
  BASE_URL,
  REFERRAL_CODE,
  ASSESSMENT_ID,
  TEST_RUN_ID,
  SIGNUP_PASSWORD,
  metrics,
  getHeaders,
  generateCandidateEmail,
  safePost,
  safeGet,
  generateSummaryReport,
} from "./common.js";

const isQuickRun = __ENV.QUICK_RUN === "true";
const targetVus = Number(__ENV.VUS) || 35;
const soakDuration = __ENV.SOAK_DURATION || "2h";

// Soak-specific performance degradation trends
const earlyAnswerLatency = new Trend("soak_early_answer_duration_ms");
const sustainedAnswerLatency = new Trend("soak_sustained_answer_duration_ms");
const sessionExpiryCounter = new Counter("soak_session_expiries");

export const options = {
  scenarios: {
    soak_endurance: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: isQuickRun
        ? [
            { duration: "20s", target: 5 },
            { duration: "1m", target: 5 },
            { duration: "20s", target: 0 },
          ]
        : [
            { duration: "5m", target: targetVus },       // Gentle ramp to target 25-50 VUs
            { duration: soakDuration, target: targetVus }, // Long-term sustained endurance (2-4 hours)
            { duration: "5m", target: 0 },               // Graceful ramp-down
          ],
      gracefulRampDown: "1m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"], // Overall error rate must stay below 5%
    "http_req_duration{endpoint:answer}": ["p(95)<5000", "p(99)<8000"],
    "http_req_duration{endpoint:heartbeat}": ["p(95)<4000"],
    "http_req_duration{endpoint:start_test}": ["p(95)<30000"],
    "http_req_duration{endpoint:submit}": ["p(95)<15000"],
    errors_401_unauthorized: ["count==0"],
    errors_403_forbidden: ["count==0"],
    errors_5xx: ["count<25"],
  },
};

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[PART 3 - TEST 1: SOAK / ENDURANCE TEST]`);
  console.log(`Target URL:        ${BASE_URL}`);
  console.log(`Assessment ID:     ${ASSESSMENT_ID}`);
  console.log(`Referral Code:     ${REFERRAL_CODE}`);
  console.log(`Concurrent VUs:    ${targetVus} candidates`);
  console.log(`Duration:          ${isQuickRun ? "QUICK RUN (2m)" : soakDuration}`);
  console.log(`Test Run ID:       ${TEST_RUN_ID}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID, testStartEpoch: Date.now() };
}

export default function (data) {
  const vuId = __VU;
  const iteration = __ITER;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const candidateEmail = generateCandidateEmail(`soak-vu${vuId}`, iteration);
  const startTime = Date.now();
  const testStartEpoch = data.testStartEpoch || startTime;

  // Staggered pacing between iterations
  sleep(Math.random() * 2 + 1);

  // -------------------------------------------------------------
  // Step 1: Candidate Registration
  // -------------------------------------------------------------
  const signupPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
    fullName: `Soak Candidate VU${vuId}-${iteration}`,
    referralCode: REFERRAL_CODE,
  });

  const signupRes = safePost(`${BASE_URL}/auth/signup`, signupPayload, getHeaders(), "signup");
  const signupOk = check(signupRes, {
    "1. Signup successful (200/201)": (r) => r.status === 200 || r.status === 201,
  });

  if (!signupOk) {
    metrics.candidatesFailed.add(1);
    return;
  }

  // -------------------------------------------------------------
  // Step 2: Login & JWT Token
  // -------------------------------------------------------------
  const loginPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
  });

  const loginStart = Date.now();
  const loginRes = safePost(`${BASE_URL}/auth/login`, loginPayload, getHeaders(), "login");
  metrics.loginDuration.add(Date.now() - loginStart);

  const loginOk = check(loginRes, {
    "2. Login status valid (200/201)": (r) => r.status === 200 || r.status === 201,
    "2. Access token received": (r) => Boolean(r.json("data.accessToken") || r.json("accessToken")),
  });

  if (!loginOk) {
    metrics.candidatesFailed.add(1);
    return;
  }

  const accessToken = loginRes.json("data.accessToken") || loginRes.json("accessToken");
  const authHeaders = getHeaders(accessToken);

  // -------------------------------------------------------------
  // Step 3: Session Health Validation (GET /auth/me)
  // -------------------------------------------------------------
  const meRes = safeGet(`${BASE_URL}/auth/me`, authHeaders, "auth_me");
  const meOk = check(meRes, {
    "3. Session valid (200)": (r) => r.status === 200,
  });

  if (!meOk) {
    if (meRes.status === 401) sessionExpiryCounter.add(1);
    metrics.candidatesFailed.add(1);
    return;
  }

  sleep(1);

  // -------------------------------------------------------------
  // Step 4: Start Assessment Instance (POST /tests/start)
  // -------------------------------------------------------------
  const startPayload = JSON.stringify({ testConfigId: assessmentId });
  const startTestStart = Date.now();
  const startRes = safePost(`${BASE_URL}/tests/start`, startPayload, authHeaders, "start_test");
  metrics.startTestDuration.add(Date.now() - startTestStart);

  const startOk = check(startRes, {
    "4. Assessment instance created (200)": (r) => r.status === 200,
    "4. Test instance ID returned": (r) => Boolean(r.json("data.testInstanceId") || r.json("testInstanceId")),
  });

  if (!startOk) {
    metrics.candidatesFailed.add(1);
    return;
  }

  const testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");

  // -------------------------------------------------------------
  // Step 5: Questions Snapshot Manifest (GET /tests/:id)
  // -------------------------------------------------------------
  const snapStart = Date.now();
  const snapshotRes = safeGet(`${BASE_URL}/tests/${testInstanceId}`, authHeaders, "snapshot");
  metrics.snapshotDuration.add(Date.now() - snapStart);

  const snapOk = check(snapshotRes, {
    "5. Snapshot loaded (200)": (r) => r.status === 200,
    "5. Sections available": (r) => Array.isArray(r.json("data.sections")) && r.json("data.sections").length > 0,
  });

  if (!snapOk) {
    metrics.candidatesFailed.add(1);
    return;
  }

  const sections = snapshotRes.json("data.sections") || [];
  const firstSection = sections[0] || {};
  const questions = firstSection.questions || [];
  const questionsToAnswer = questions.slice(0, Math.min(5, questions.length));

  // -------------------------------------------------------------
  // Step 6: Sequential Answer Autosaves with Human Think Times
  // -------------------------------------------------------------
  let answeredCount = 0;
  for (let i = 0; i < questionsToAnswer.length; i++) {
    const q = questionsToAnswer[i];
    const answerPayload = JSON.stringify({
      questionId: q.questionId,
      answer: ["A", "B", "C", "D"][i % 4],
      timeSpentSeconds: 15,
      isMarkedForReview: false,
    });

    const ansStart = Date.now();
    const ansRes = safePost(`${BASE_URL}/tests/${testInstanceId}/answer`, answerPayload, authHeaders, "answer");
    const ansDuration = Date.now() - ansStart;
    metrics.answerDuration.add(ansDuration);

    // Track latency drift: first 20 mins vs later in soak test
    const elapsedSinceStart = Date.now() - testStartEpoch;
    if (elapsedSinceStart < 20 * 60 * 1000) {
      earlyAnswerLatency.add(ansDuration);
    } else {
      sustainedAnswerLatency.add(ansDuration);
    }

    const ansOk = check(ansRes, {
      "6. Answer saved (200)": (r) => r.status === 200,
    });

    if (ansOk) {
      metrics.answersSuccess.add(1);
      answeredCount++;
    } else {
      metrics.answersFailed.add(1);
    }

    // Realistic human cadence (2.5 - 4.5s)
    sleep(Math.random() * 2 + 2.5);
  }

  // -------------------------------------------------------------
  // Step 7: Section Advance & Telemetry Heartbeat
  // -------------------------------------------------------------
  const advStart = Date.now();
  const advRes = safePost(`${BASE_URL}/tests/${testInstanceId}/sections/advance`, null, authHeaders, "section_advance");
  metrics.sectionAdvanceDuration.add(Date.now() - advStart);

  check(advRes, {
    "7. Section transition valid (200 or 409)": (r) => r.status === 200 || r.status === 409,
  });

  sleep(1.5);

  // Send Heartbeat
  const hbPayload = JSON.stringify({
    currentSectionIndex: 1,
    currentQuestionIndex: 0,
    answeredCount: answeredCount,
    totalQuestions: 162,
    remainingTimeSeconds: 5100,
    networkStatus: "ONLINE",
    autosaveHealth: "HEALTHY",
  });

  const hbStart = Date.now();
  const hbRes = safePost(`${BASE_URL}/tests/${testInstanceId}/heartbeat`, hbPayload, authHeaders, "heartbeat");
  metrics.heartbeatDuration.add(Date.now() - hbStart);

  check(hbRes, {
    "8. Heartbeat acknowledged (200)": (r) => r.status === 200,
  });

  sleep(Math.random() * 2 + 1);

  // -------------------------------------------------------------
  // Step 8: Final Assessment Submission
  // -------------------------------------------------------------
  const submitStart = Date.now();
  const submitRes = safePost(
    `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
    null,
    authHeaders,
    "submit"
  );
  metrics.submitDuration.add(Date.now() - submitStart);

  const submitOk = check(submitRes, {
    "9. Submission successful (200)": (r) => r.status === 200,
    "9. Submission confirmed in payload": (r) => Boolean(r.json("data.submissionId") || r.json("data.status") === "SUBMITTED"),
  });

  if (submitOk) {
    metrics.submissionsSuccess.add(1);
    metrics.candidatesSuccess.add(1);
  } else {
    metrics.submissionsFailed.add(1);
    metrics.candidatesFailed.add(1);
  }

  // Rest interval between candidate lifecycle iterations
  sleep(Math.random() * 3 + 2);
}

export function handleSummary(data) {
  const report = generateSummaryReport(
    data,
    "Part 3 - Test 1: Qloax Soak / Endurance Test Report",
    `Sustained load of ${targetVus} concurrent candidates over ${isQuickRun ? "2 minutes" : soakDuration}. Evaluates memory leaks, latency drift, and session stability.`
  );

  return {
    stdout: report,
    "load-tests/reports/soak-test-report.md": report,
  };
}
