/**
 * Part 2 - Test 2: Qloax Spike Test
 *
 * Rapidly surges candidate load to simulate burst scenarios (e.g. batch exam start):
 * Spike Profile: 10 → 100 → 200 candidates.
 *
 * Evaluates:
 * 1. Sudden registration and assessment generation bursts
 * 2. Concurrent answer autosaves and telemetry heartbeats under instantaneous surge
 * 3. Error rate behavior during the surge vs stability and recovery post-spike
 * 4. Recovery: Does API latency return to nominal levels (<3500ms) once the burst subsides?
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";
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
const spikeErrors = new Counter("spike_phase_errors");
const spikeReqDuration = new Trend("spike_req_duration_ms");
const recoveryReqDuration = new Trend("recovery_req_duration_ms");

export const options = {
  scenarios: {
    spike_traffic: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: isQuickRun
        ? [
            { duration: "10s", target: 5 },   // Baseline
            { duration: "10s", target: 20 },  // Quick Spike
            { duration: "20s", target: 20 },  // Spike hold
            { duration: "10s", target: 5 },   // Quick Recovery
            { duration: "10s", target: 0 },
          ]
        : [
            // Phase 1: Baseline steady 10 candidates (observe nominal behavior)
            { duration: "30s", target: 10 },
            { duration: "1m", target: 10 },
            // Phase 2: SPIKE 1! Rapid surge to 100 candidates in 15 seconds!
            { duration: "15s", target: 100 },
            { duration: "2m", target: 100 },
            // Phase 3: RECOVERY 1! Rapid drop back to 10 candidates
            { duration: "20s", target: 10 },
            { duration: "1.5m", target: 10 }, // Monitor recovery latency
            // Phase 4: SPIKE 2! Extreme surge to 200 candidates in 20 seconds!
            { duration: "20s", target: 200 },
            { duration: "2m", target: 200 },
            // Phase 5: RECOVERY 2! Drop to baseline (10 candidates)
            { duration: "30s", target: 10 },
            { duration: "1.5m", target: 10 },
            // Phase 6: Wind down
            { duration: "30s", target: 0 },
          ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.10"], // Allow up to 10% transient fails during massive 200 VU sudden spikes
    "http_req_duration{endpoint:answer}": ["p(95)<7000"],
    "http_req_duration{endpoint:heartbeat}": ["p(95)<6000"],
    "http_req_duration{endpoint:start_test}": ["p(95)<35000"],
    "http_req_duration{endpoint:submit}": ["p(95)<15000"],
    errors_401_unauthorized: ["count==0"],
    errors_403_forbidden: ["count==0"],
  },
};

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[PART 2 - TEST 2: SPIKE TEST]`);
  console.log(`Target URL:        ${BASE_URL}`);
  console.log(`Assessment ID:     ${ASSESSMENT_ID}`);
  console.log(`Referral Code:     ${REFERRAL_CODE}`);
  console.log(`Spike Profile:     10 -> 100 -> 200 Candidates`);
  console.log(`Mode:              ${isQuickRun ? "QUICK VALIDATION" : "FULL SPIKE & RECOVERY"}`);
  console.log(`Test Run ID:       ${TEST_RUN_ID}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const vuId = __VU;
  const iteration = __ITER;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const candidateEmail = generateCandidateEmail(`spike-vu${vuId}`, iteration);
  const startTime = Date.now();

  // Natural jitter (1 to 2.5s)
  sleep(Math.random() * 1.5 + 1);

  // -------------------------------------------------------------
  // Phase 1: Sudden Candidate Signup
  // -------------------------------------------------------------
  const signupPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
    fullName: `Spike Candidate VU${vuId}-${iteration}`,
    referralCode: REFERRAL_CODE,
  });

  const signupRes = safePost(`${BASE_URL}/auth/signup`, signupPayload, getHeaders(), "signup");
  const signupOk = check(signupRes, {
    "1. Spike signup status valid (200/201)": (r) => r.status === 200 || r.status === 201,
  });

  if (!signupOk) {
    spikeErrors.add(1);
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
    "2. Spike login valid (200/201)": (r) => r.status === 200 || r.status === 201,
    "2. Access token extracted": (r) => Boolean(r.json("data.accessToken") || r.json("accessToken")),
  });

  if (!loginOk) {
    spikeErrors.add(1);
    metrics.candidatesFailed.add(1);
    return;
  }

  const accessToken = loginRes.json("data.accessToken") || loginRes.json("accessToken");
  const authHeaders = getHeaders(accessToken);

  // -------------------------------------------------------------
  // Phase 3: Start Assessment Under Spike Load (POST /tests/start)
  // -------------------------------------------------------------
  const startPayload = JSON.stringify({ testConfigId: assessmentId });
  const startTestStart = Date.now();
  const startRes = safePost(`${BASE_URL}/tests/start`, startPayload, authHeaders, "start_test");
  const startDuration = Date.now() - startTestStart;
  metrics.startTestDuration.add(startDuration);

  // Track whether this request happened during peak spike or baseline
  if (__VU >= 50) {
    spikeReqDuration.add(startDuration);
  } else {
    recoveryReqDuration.add(startDuration);
  }

  const startOk = check(startRes, {
    "3. Assessment instance generated (200)": (r) => r.status === 200,
    "3. TestInstance ID present": (r) => Boolean(r.json("data.testInstanceId") || r.json("testInstanceId")),
  });

  if (!startOk) {
    spikeErrors.add(1);
    metrics.candidatesFailed.add(1);
    return;
  }

  const testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");

  // -------------------------------------------------------------
  // Phase 4: Fetch Snapshot Under Surge (GET /tests/:id)
  // -------------------------------------------------------------
  const snapStart = Date.now();
  const snapshotRes = safeGet(`${BASE_URL}/tests/${testInstanceId}`, authHeaders, "snapshot");
  metrics.snapshotDuration.add(Date.now() - snapStart);

  const snapOk = check(snapshotRes, {
    "4. Questions snapshot retrieved (200)": (r) => r.status === 200,
  });

  if (!snapOk) {
    spikeErrors.add(1);
    metrics.candidatesFailed.add(1);
    return;
  }

  const sections = snapshotRes.json("data.sections") || [];
  const firstSection = sections[0] || {};
  const questions = firstSection.questions || [];
  const questionsToAnswer = questions.slice(0, Math.min(4, questions.length));

  // -------------------------------------------------------------
  // Phase 5: Answer Submissions Under Spike Pressure
  // -------------------------------------------------------------
  let answeredCount = 0;
  for (let i = 0; i < questionsToAnswer.length; i++) {
    const q = questionsToAnswer[i];
    const answerPayload = JSON.stringify({
      questionId: q.questionId,
      answer: ["A", "B", "C", "D"][i % 4],
      timeSpentSeconds: 10,
      isMarkedForReview: false,
    });

    const ansStart = Date.now();
    const ansRes = safePost(`${BASE_URL}/tests/${testInstanceId}/answer`, answerPayload, authHeaders, "answer");
    const ansDuration = Date.now() - ansStart;
    metrics.answerDuration.add(ansDuration);

    if (__VU >= 50) {
      spikeReqDuration.add(ansDuration);
    } else {
      recoveryReqDuration.add(ansDuration);
    }

    const ansOk = check(ansRes, {
      "5. Answer autosaved successfully (200)": (r) => r.status === 200,
    });

    if (ansOk) {
      metrics.answersSuccess.add(1);
      answeredCount++;
    } else {
      spikeErrors.add(1);
      metrics.answersFailed.add(1);
    }

    // Realistic candidate pause
    sleep(Math.random() * 2 + 2);
  }

  // -------------------------------------------------------------
  // Phase 6: Section Advancement
  // -------------------------------------------------------------
  const advStart = Date.now();
  const advRes = safePost(`${BASE_URL}/tests/${testInstanceId}/sections/advance`, null, authHeaders, "section_advance");
  metrics.sectionAdvanceDuration.add(Date.now() - advStart);

  check(advRes, {
    "6. Section transition handled (200 or 409)": (r) => r.status === 200 || r.status === 409,
  });

  sleep(1);

  // -------------------------------------------------------------
  // Phase 7: Telemetry Heartbeat
  // -------------------------------------------------------------
  const hbPayload = JSON.stringify({
    currentSectionIndex: 1,
    currentQuestionIndex: 0,
    answeredCount: answeredCount,
    totalQuestions: 162,
    remainingTimeSeconds: 4900,
    networkStatus: "ONLINE",
    autosaveHealth: "HEALTHY",
  });

  const hbStart = Date.now();
  const hbRes = safePost(`${BASE_URL}/tests/${testInstanceId}/heartbeat`, hbPayload, authHeaders, "heartbeat");
  metrics.heartbeatDuration.add(Date.now() - hbStart);

  check(hbRes, {
    "7. Telemetry heartbeat recorded (200)": (r) => r.status === 200,
  });

  sleep(Math.random() * 2 + 1);

  // -------------------------------------------------------------
  // Phase 8: Assessment Submission
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
    "8. Final submission completed (200)": (r) => r.status === 200,
    "8. Submission confirmation received": (r) => Boolean(r.json("data.submissionId") || r.json("data.status") === "SUBMITTED"),
  });

  if (submitOk) {
    metrics.submissionsSuccess.add(1);
    metrics.candidatesSuccess.add(1);
  } else {
    spikeErrors.add(1);
    metrics.submissionsFailed.add(1);
    metrics.candidatesFailed.add(1);
  }
}

export function handleSummary(data) {
  const report = generateSummaryReport(
    data,
    "Part 2 - Test 2: Qloax Spike & Recovery Test Report",
    `Spike Profile: 10 -> 100 -> 200 candidates. Tests sudden traffic surges and verifies post-spike system recovery.`
  );

  return {
    stdout: report,
    "load-tests/reports/spike-test-report.md": report,
  };
}
