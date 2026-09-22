/**
 * Part 2 - Test 1: Qloax Gradual Stress Test
 *
 * Gradually increases candidate load to evaluate system stability and SLA thresholds:
 * Load Profile: 10 → 25 → 50 → 100 → 200 candidates.
 *
 * Complete assessment workflow per candidate:
 * 1. Unique Signup + QLO Referral Code
 * 2. Login & JWT Authentication
 * 3. Session Verification (GET /auth/me)
 * 4. Assessment Instance Creation (POST /tests/start)
 * 5. Questions Manifest Snapshot (GET /tests/:id)
 * 6. Sequential Answer Autosaves (POST /tests/:id/answer) with human think times
 * 7. Section Advancement (POST /tests/:id/sections/advance)
 * 8. Telemetry Heartbeat (POST /tests/:id/heartbeat)
 * 9. Assessment Submission (POST /tests/:id/submit?allowPartial=true)
 *
 * Measures:
 * - p95 / p99 Latency per endpoint
 * - Requests Per Second (RPS)
 * - Error Rate % & 4xx / 5xx / 401 breakdown
 * - Failed answers and failed submissions
 * - Identifies where latency inflection / degradation begins
 */

import http from "k6/http";
import { check, sleep } from "k6";
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

// Stage duration configuration
const isQuickRun = __ENV.QUICK_RUN === "true";
const maxVus = Number(__ENV.MAX_VUS) || 200;

export const options = {
  scenarios: {
    stress_ramp: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: isQuickRun
        ? [
            { duration: "20s", target: 5 },
            { duration: "30s", target: 10 },
            { duration: "30s", target: Math.min(25, maxVus) },
            { duration: "20s", target: 0 },
          ]
        : [
            // Stage 1: Warmup & Initial baseline (10 VUs)
            { duration: "1m", target: 10 },
            { duration: "1m", target: 10 },
            // Stage 2: 25 VUs
            { duration: "1m", target: Math.min(25, maxVus) },
            { duration: "2m", target: Math.min(25, maxVus) },
            // Stage 3: 50 VUs
            { duration: "1.5m", target: Math.min(50, maxVus) },
            { duration: "2m", target: Math.min(50, maxVus) },
            // Stage 4: 100 VUs
            { duration: "2m", target: Math.min(100, maxVus) },
            { duration: "2m", target: Math.min(100, maxVus) },
            // Stage 5: 200 VUs (Peak Stress)
            { duration: "2m", target: maxVus },
            { duration: "2m", target: maxVus },
            // Stage 6: Recovery Ramp Down
            { duration: "1.5m", target: 0 },
          ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.08"], // Target < 8% errors at extreme 200 VU peak
    "http_req_duration{endpoint:answer}": ["p(95)<6000", "p(99)<10000"],
    "http_req_duration{endpoint:heartbeat}": ["p(95)<5000", "p(99)<8000"],
    "http_req_duration{endpoint:start_test}": ["p(95)<30000", "p(99)<45000"],
    "http_req_duration{endpoint:submit}": ["p(95)<15000", "p(99)<25000"],
    errors_401_unauthorized: ["count==0"],
    errors_403_forbidden: ["count==0"],
  },
};

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[PART 2 - TEST 1: STRESS TEST]`);
  console.log(`Target URL:        ${BASE_URL}`);
  console.log(`Assessment ID:     ${ASSESSMENT_ID}`);
  console.log(`Referral Code:     ${REFERRAL_CODE}`);
  console.log(`Max Target VUs:    ${maxVus} candidates`);
  console.log(`Mode:              ${isQuickRun ? "QUICK VALIDATION" : "FULL MULTI-STAGE STRESS"}`);
  console.log(`Test Run ID:       ${TEST_RUN_ID}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const vuId = __VU;
  const iteration = __ITER;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const candidateEmail = generateCandidateEmail(`stress-vu${vuId}`, iteration);
  const startTime = Date.now();

  // Natural pacing stagger
  sleep(Math.random() * 2 + 1);

  // -------------------------------------------------------------
  // Phase 1: Candidate Signup
  // -------------------------------------------------------------
  const signupPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
    fullName: `Stress Candidate VU${vuId}-${iteration}`,
    referralCode: REFERRAL_CODE,
  });

  const signupRes = safePost(`${BASE_URL}/auth/signup`, signupPayload, getHeaders(), "signup");
  const signupOk = check(signupRes, {
    "1. Signup status valid (200/201)": (r) => r.status === 200 || r.status === 201,
  });

  if (!signupOk) {
    metrics.candidatesFailed.add(1);
    return;
  }

  // -------------------------------------------------------------
  // Phase 2: Candidate Login
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
  // Phase 3: Session Identity (GET /auth/me)
  // -------------------------------------------------------------
  const meRes = safeGet(`${BASE_URL}/auth/me`, authHeaders, "auth_me");
  check(meRes, {
    "3. Session valid (200)": (r) => r.status === 200,
  });

  sleep(1);

  // -------------------------------------------------------------
  // Phase 4: Start Assessment Instance (POST /tests/start)
  // -------------------------------------------------------------
  const startPayload = JSON.stringify({ testConfigId: assessmentId });
  const startTestStart = Date.now();
  const startRes = safePost(`${BASE_URL}/tests/start`, startPayload, authHeaders, "start_test");
  metrics.startTestDuration.add(Date.now() - startTestStart);

  const startOk = check(startRes, {
    "4. Assessment started (200)": (r) => r.status === 200,
    "4. Test instance ID returned": (r) => Boolean(r.json("data.testInstanceId") || r.json("testInstanceId")),
  });

  if (!startOk) {
    metrics.candidatesFailed.add(1);
    return;
  }

  const testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");

  // -------------------------------------------------------------
  // Phase 5: Load Question Manifest (GET /tests/:id)
  // -------------------------------------------------------------
  const snapStart = Date.now();
  const snapshotRes = safeGet(`${BASE_URL}/tests/${testInstanceId}`, authHeaders, "snapshot");
  metrics.snapshotDuration.add(Date.now() - snapStart);

  const snapOk = check(snapshotRes, {
    "5. Questions snapshot loaded (200)": (r) => r.status === 200,
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
  // Phase 6: Answer Questions with Realistic Cadence
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
    metrics.answerDuration.add(Date.now() - ansStart);

    const ansOk = check(ansRes, {
      "6. Answer saved (200)": (r) => r.status === 200,
    });

    if (ansOk) {
      metrics.answersSuccess.add(1);
      answeredCount++;
    } else {
      metrics.answersFailed.add(1);
    }

    // Realistic human delay between answers
    sleep(Math.random() * 2 + 2);
  }

  // -------------------------------------------------------------
  // Phase 7: Section Advance & Telemetry Heartbeat
  // -------------------------------------------------------------
  const advStart = Date.now();
  const advRes = safePost(`${BASE_URL}/tests/${testInstanceId}/sections/advance`, null, authHeaders, "section_advance");
  metrics.sectionAdvanceDuration.add(Date.now() - advStart);

  check(advRes, {
    "7. Section advanced (200 or 409)": (r) => r.status === 200 || r.status === 409,
  });

  sleep(1);

  // Heartbeat
  const hbPayload = JSON.stringify({
    currentSectionIndex: 1,
    currentQuestionIndex: 0,
    answeredCount: answeredCount,
    totalQuestions: 162,
    remainingTimeSeconds: 5000,
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
  // Phase 8: Final Assessment Submission
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
    "9. Submission completed (200)": (r) => r.status === 200,
    "9. Submission confirmed": (r) => Boolean(r.json("data.submissionId") || r.json("data.status") === "SUBMITTED"),
  });

  if (submitOk) {
    metrics.submissionsSuccess.add(1);
    metrics.candidatesSuccess.add(1);
  } else {
    metrics.submissionsFailed.add(1);
    metrics.candidatesFailed.add(1);
  }
}

export function handleSummary(data) {
  const report = generateSummaryReport(
    data,
    "Part 2 - Test 1: Qloax Gradual Stress Test Report",
    `Gradual load ramp: 10 -> 25 -> 50 -> 100 -> 200 candidates. Evaluates throughput, answer autosave latency, and SLA thresholds.`
  );

  return {
    stdout: report,
    "load-tests/reports/stress-test-report.md": report,
  };
}
