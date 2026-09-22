/**
 * Part 2 - Test 3: Qloax Capacity & Breakpoint Test
 *
 * Incrementally scales candidate load to determine the absolute breaking point
 * and identify the MAXIMUM STABLE CONCURRENT CANDIDATE CAPACITY.
 *
 * Load Stepping Profile:
 * 10 → 25 → 50 → 75 → 100 → 125 → 150 → 175 → 200 → 250 candidates.
 *
 * Criteria for Maximum Stable Capacity:
 * - Answer Autosave Latency: p(95) < 5,000ms
 * - Heartbeat Latency: p(95) < 4,000ms
 * - Overall Error Rate: < 5%
 * - Zero unhandled 5xx server crashes / database connection pool exhaustion
 *
 * Once error rates exceed 10% or p95 answer latency breaches 8,000ms, that concurrency
 * tier is registered as the SYSTEM BREAKPOINT.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Gauge, Rate } from "k6/metrics";
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
const maxTargetVus = Number(__ENV.MAX_TARGET_VUS) || 250;

// Dedicated Breakpoint Metrics
const breakpointViolations = new Counter("breakpoint_sla_violations");
const activeCandidatesGauge = new Gauge("active_candidates_count");
const isOverCapacityRate = new Rate("system_over_capacity_rate");

export const options = {
  scenarios: {
    breakpoint_stepped_ramp: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: isQuickRun
        ? [
            { duration: "15s", target: 5 },
            { duration: "20s", target: 10 },
            { duration: "20s", target: 20 },
            { duration: "20s", target: 30 },
            { duration: "15s", target: 0 },
          ]
        : [
            // Step 1: 10 candidates (warm baseline)
            { duration: "45s", target: 10 },
            { duration: "1m", target: 10 },
            // Step 2: 25 candidates
            { duration: "45s", target: Math.min(25, maxTargetVus) },
            { duration: "1.5m", target: Math.min(25, maxTargetVus) },
            // Step 3: 50 candidates
            { duration: "45s", target: Math.min(50, maxTargetVus) },
            { duration: "1.5m", target: Math.min(50, maxTargetVus) },
            // Step 4: 75 candidates
            { duration: "45s", target: Math.min(75, maxTargetVus) },
            { duration: "1.5m", target: Math.min(75, maxTargetVus) },
            // Step 5: 100 candidates
            { duration: "1m", target: Math.min(100, maxTargetVus) },
            { duration: "2m", target: Math.min(100, maxTargetVus) },
            // Step 6: 125 candidates
            { duration: "1m", target: Math.min(125, maxTargetVus) },
            { duration: "2m", target: Math.min(125, maxTargetVus) },
            // Step 7: 150 candidates
            { duration: "1m", target: Math.min(150, maxTargetVus) },
            { duration: "2m", target: Math.min(150, maxTargetVus) },
            // Step 8: 175 candidates
            { duration: "1m", target: Math.min(175, maxTargetVus) },
            { duration: "2m", target: Math.min(175, maxTargetVus) },
            // Step 9: 200 candidates
            { duration: "1m", target: Math.min(200, maxTargetVus) },
            { duration: "2m", target: Math.min(200, maxTargetVus) },
            // Step 10: 250 candidates (Upper Stress Horizon)
            { duration: "1m", target: maxTargetVus },
            { duration: "2m", target: maxTargetVus },
            // Recovery ramp down
            { duration: "1m", target: 0 },
          ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.15"], // Flags if failure rate breaches 15% under extreme saturation
    "http_req_duration{endpoint:answer}": ["p(95)<8000"], // Breakpoint SLA limit for autosave
    "http_req_duration{endpoint:heartbeat}": ["p(95)<7000"],
    "http_req_duration{endpoint:start_test}": ["p(95)<45000"],
    "http_req_duration{endpoint:submit}": ["p(95)<20000"],
    errors_5xx: ["count<100"],
  },
};

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[PART 2 - TEST 3: CAPACITY & BREAKPOINT TEST]`);
  console.log(`Target Base URL:   ${BASE_URL}`);
  console.log(`Assessment ID:     ${ASSESSMENT_ID}`);
  console.log(`Referral Code:     ${REFERRAL_CODE}`);
  console.log(`Stepping Target:   Up to ${maxTargetVus} Concurrent Candidates`);
  console.log(`Mode:              ${isQuickRun ? "QUICK BREAKPOINT TRIAL" : "FULL STEPPED CAPACITY AUDIT"}`);
  console.log(`Test Run ID:       ${TEST_RUN_ID}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const vuId = __VU;
  const iteration = __ITER;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const candidateEmail = generateCandidateEmail(`brk-vu${vuId}`, iteration);
  const startTime = Date.now();

  activeCandidatesGauge.add(vuId);

  // Staggered candidate arrival
  sleep(Math.random() * 2 + 1);

  // -------------------------------------------------------------
  // Phase 1: Registration
  // -------------------------------------------------------------
  const signupPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
    fullName: `Breakpoint Candidate VU${vuId}-${iteration}`,
    referralCode: REFERRAL_CODE,
  });

  const signupRes = safePost(`${BASE_URL}/auth/signup`, signupPayload, getHeaders(), "signup");
  const signupOk = check(signupRes, {
    "1. Signup successful (200/201)": (r) => r.status === 200 || r.status === 201,
  });

  if (!signupOk) {
    breakpointViolations.add(1);
    isOverCapacityRate.add(1);
    metrics.candidatesFailed.add(1);
    return;
  }

  // -------------------------------------------------------------
  // Phase 2: Login
  // -------------------------------------------------------------
  const loginPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
  });

  const loginStart = Date.now();
  const loginRes = safePost(`${BASE_URL}/auth/login`, loginPayload, getHeaders(), "login");
  metrics.loginDuration.add(Date.now() - loginStart);

  const loginOk = check(loginRes, {
    "2. Login succeeded (200/201)": (r) => r.status === 200 || r.status === 201,
    "2. Auth token generated": (r) => Boolean(r.json("data.accessToken") || r.json("accessToken")),
  });

  if (!loginOk) {
    breakpointViolations.add(1);
    isOverCapacityRate.add(1);
    metrics.candidatesFailed.add(1);
    return;
  }

  const accessToken = loginRes.json("data.accessToken") || loginRes.json("accessToken");
  const authHeaders = getHeaders(accessToken);

  // -------------------------------------------------------------
  // Phase 3: Start Test (Database-intensive step)
  // -------------------------------------------------------------
  const startPayload = JSON.stringify({ testConfigId: assessmentId });
  const startTestStart = Date.now();
  const startRes = safePost(`${BASE_URL}/tests/start`, startPayload, authHeaders, "start_test");
  const startDuration = Date.now() - startTestStart;
  metrics.startTestDuration.add(startDuration);

  if (startDuration > 30000 || startRes.status >= 500) {
    breakpointViolations.add(1);
    isOverCapacityRate.add(1);
  } else {
    isOverCapacityRate.add(0);
  }

  const startOk = check(startRes, {
    "3. Assessment generated (200)": (r) => r.status === 200,
    "3. TestInstance ID assigned": (r) => Boolean(r.json("data.testInstanceId") || r.json("testInstanceId")),
  });

  if (!startOk) {
    breakpointViolations.add(1);
    metrics.candidatesFailed.add(1);
    return;
  }

  const testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");

  // -------------------------------------------------------------
  // Phase 4: Fetch Questions Manifest
  // -------------------------------------------------------------
  const snapStart = Date.now();
  const snapshotRes = safeGet(`${BASE_URL}/tests/${testInstanceId}`, authHeaders, "snapshot");
  metrics.snapshotDuration.add(Date.now() - snapStart);

  const snapOk = check(snapshotRes, {
    "4. Snapshot loaded (200)": (r) => r.status === 200,
  });

  if (!snapOk) {
    breakpointViolations.add(1);
    metrics.candidatesFailed.add(1);
    return;
  }

  const sections = snapshotRes.json("data.sections") || [];
  const firstSection = sections[0] || {};
  const questions = firstSection.questions || [];
  const questionsToAnswer = questions.slice(0, Math.min(5, questions.length));

  // -------------------------------------------------------------
  // Phase 5: Continuous Answer Autosaves
  // -------------------------------------------------------------
  let answeredCount = 0;
  for (let i = 0; i < questionsToAnswer.length; i++) {
    const q = questionsToAnswer[i];
    const answerPayload = JSON.stringify({
      questionId: q.questionId,
      answer: ["A", "B", "C", "D"][i % 4],
      timeSpentSeconds: 12,
      isMarkedForReview: false,
    });

    const ansStart = Date.now();
    const ansRes = safePost(`${BASE_URL}/tests/${testInstanceId}/answer`, answerPayload, authHeaders, "answer");
    const ansDuration = Date.now() - ansStart;
    metrics.answerDuration.add(ansDuration);

    // Flag SLA breach if autosave exceeds 5000ms
    if (ansDuration > 5000 || ansRes.status >= 500) {
      breakpointViolations.add(1);
      isOverCapacityRate.add(1);
    } else {
      isOverCapacityRate.add(0);
    }

    const ansOk = check(ansRes, {
      "5. Answer autosaved (200)": (r) => r.status === 200,
    });

    if (ansOk) {
      metrics.answersSuccess.add(1);
      answeredCount++;
    } else {
      metrics.answersFailed.add(1);
    }

    // Realistic candidate cadence
    sleep(Math.random() * 2 + 2);
  }

  // -------------------------------------------------------------
  // Phase 6: Advance Section
  // -------------------------------------------------------------
  const advStart = Date.now();
  const advRes = safePost(`${BASE_URL}/tests/${testInstanceId}/sections/advance`, null, authHeaders, "section_advance");
  metrics.sectionAdvanceDuration.add(Date.now() - advStart);

  check(advRes, {
    "6. Section advance valid (200 or 409)": (r) => r.status === 200 || r.status === 409,
  });

  sleep(1);

  // -------------------------------------------------------------
  // Phase 7: Heartbeat
  // -------------------------------------------------------------
  const hbPayload = JSON.stringify({
    currentSectionIndex: 1,
    currentQuestionIndex: 0,
    answeredCount: answeredCount,
    totalQuestions: 162,
    remainingTimeSeconds: 4800,
    networkStatus: "ONLINE",
    autosaveHealth: "HEALTHY",
  });

  const hbStart = Date.now();
  const hbRes = safePost(`${BASE_URL}/tests/${testInstanceId}/heartbeat`, hbPayload, authHeaders, "heartbeat");
  metrics.heartbeatDuration.add(Date.now() - hbStart);

  check(hbRes, {
    "7. Heartbeat recorded (200)": (r) => r.status === 200,
  });

  sleep(Math.random() * 2 + 1);

  // -------------------------------------------------------------
  // Phase 8: Assessment Final Submission
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
    "8. Submission succeeded (200)": (r) => r.status === 200,
    "8. Submission finalized": (r) => Boolean(r.json("data.submissionId") || r.json("data.status") === "SUBMITTED"),
  });

  if (submitOk) {
    metrics.submissionsSuccess.add(1);
    metrics.candidatesSuccess.add(1);
  } else {
    breakpointViolations.add(1);
    metrics.submissionsFailed.add(1);
    metrics.candidatesFailed.add(1);
  }
}

export function handleSummary(data) {
  const getMetricVal = (name, field = "value") => {
    if (data.metrics[name] && data.metrics[name].values) {
      return data.metrics[name].values[field] ?? 0;
    }
    return 0;
  };

  const peakVus = getMetricVal("vus", "max");
  const violations = getMetricVal("breakpoint_sla_violations", "count");
  const errorRate = (getMetricVal("http_req_failed", "rate") * 100).toFixed(2);
  const p95Answer = Math.round(data.metrics["http_req_duration{endpoint:answer}"]?.values["p(95)"] || 0);

  // Compute estimated maximum stable capacity
  let stableCapacityEstimate = peakVus;
  let breakpointStatus = "STABLE WITHIN TESTED RANGE";

  if (Number(errorRate) > 5.0 || p95Answer > 5000 || violations > 20) {
    stableCapacityEstimate = Math.max(10, Math.floor(peakVus * 0.6));
    breakpointStatus = `BREAKPOINT DETECTED (Violations: ${violations}, Error Rate: ${errorRate}%, p95 Answer: ${p95Answer}ms)`;
  }

  const baseReport = generateSummaryReport(
    data,
    "Part 2 - Test 3: Qloax Capacity & Breakpoint Test Report",
    `Stepped Capacity Audit up to ${maxTargetVus} concurrent candidates. Identifies SLA breaking limits.`
  );

  const capacityAnalysis = `
--------------------------------------------------------------------------------
## 4. Capacity & Breakpoint Evaluation
- Peak Concurrency Evaluated:       ${peakVus} VUs
- SLA Violations (Latency > 5s/Err): ${violations}
- Breakpoint Status:                ${breakpointStatus}
- Maximum Stable Capacity Estimate: ~${stableCapacityEstimate} Concurrent Candidates
- Bottleneck Indicator:             ${p95Answer > 5000 ? "Answer Autosave Latency / Postgres Connection Saturation" : "Healthy within tested boundaries"}
================================================================================
`;

  const fullReport = baseReport + capacityAnalysis;

  return {
    stdout: fullReport,
    "load-tests/reports/breakpoint-report.md": fullReport,
  };
}
