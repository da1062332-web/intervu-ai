/**
 * Part 3 - Test 2: Qloax Volume Test
 *
 * Evaluates platform and database performance under high data volumes:
 * - High volume of candidates, test instances, deep question snapshot manifests,
 *   rich answer payloads across multiple sections, and final submissions.
 * - Measures API & PostgreSQL latency degradation as data volume accumulates.
 * - Simulates realistic candidate workflows answering extensive question sets.
 * - Tests heavy database reads via snapshot manifests, state recovery, and attempt history.
 *
 * Environment Configs:
 * - VUS: Default 25 concurrent candidates (configurable via VUS)
 * - VOLUME_DURATION: Default "10m" (configurable via VOLUME_DURATION)
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
const targetVus = Number(__ENV.VUS) || 25;
const volumeDuration = __ENV.VOLUME_DURATION || "10m";

// Volume-specific degradation trends
const earlyAnswerLatency = new Trend("volume_early_answer_duration_ms");
const sustainedAnswerLatency = new Trend("volume_sustained_answer_duration_ms");
const historyQueryDuration = new Trend("volume_history_query_duration_ms");
const totalAnswersPersisted = new Counter("volume_answers_persisted_count");

export const options = {
  scenarios: {
    volume_traffic: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: isQuickRun
        ? [
            { duration: "20s", target: 5 },
            { duration: "1m", target: 5 },
            { duration: "20s", target: 0 },
          ]
        : [
            { duration: "1m", target: 10 },              // Initial warmup
            { duration: "2m", target: targetVus },       // Ramp to target volume VUs
            { duration: volumeDuration, target: targetVus }, // Sustained heavy data volume generation
            { duration: "1m", target: 0 },               // Graceful ramp-down
          ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"], // Error rate must stay below 5% under volume
    "http_req_duration{endpoint:answer}": ["p(95)<5000", "p(99)<8000"],
    "http_req_duration{endpoint:snapshot}": ["p(95)<6000", "p(99)<10000"],
    "http_req_duration{endpoint:start_test}": ["p(95)<30000"],
    "http_req_duration{endpoint:submit}": ["p(95)<15000"],
    errors_401_unauthorized: ["count==0"],
    errors_403_forbidden: ["count==0"],
    errors_5xx: ["count<25"],
  },
};

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[PART 3 - TEST 2: VOLUME TEST]`);
  console.log(`Target URL:        ${BASE_URL}`);
  console.log(`Assessment ID:     ${ASSESSMENT_ID}`);
  console.log(`Referral Code:     ${REFERRAL_CODE}`);
  console.log(`Concurrent VUs:    ${targetVus} candidates`);
  console.log(`Duration:          ${isQuickRun ? "QUICK RUN (2m)" : volumeDuration}`);
  console.log(`Test Run ID:       ${TEST_RUN_ID}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID, testStartEpoch: Date.now() };
}

export default function (data) {
  const vuId = __VU;
  const iteration = __ITER;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const candidateEmail = generateCandidateEmail(`vol-vu${vuId}`, iteration);
  const testStartEpoch = data.testStartEpoch || Date.now();

  // Staggered pacing between candidate runs
  sleep(Math.random() * 2 + 1);

  // -------------------------------------------------------------
  // Step 1: Candidate Registration
  // -------------------------------------------------------------
  const signupPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
    fullName: `Volume Candidate VU${vuId}-${iteration}`,
    referralCode: REFERRAL_CODE,
  });

  const signupRes = safePost(`${BASE_URL}/auth/signup`, signupPayload, getHeaders(), "signup");
  const signupOk = check(signupRes, {
    "1. Volume signup successful (200/201)": (r) => r.status === 200 || r.status === 201,
  });

  if (!signupOk) {
    metrics.candidatesFailed.add(1);
    return;
  }

  // -------------------------------------------------------------
  // Step 2: Login & Token Extraction
  // -------------------------------------------------------------
  const loginPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
  });

  const loginStart = Date.now();
  const loginRes = safePost(`${BASE_URL}/auth/login`, loginPayload, getHeaders(), "login");
  metrics.loginDuration.add(Date.now() - loginStart);

  const loginOk = check(loginRes, {
    "2. Volume login status valid (200/201)": (r) => r.status === 200 || r.status === 201,
    "2. Access token received": (r) => Boolean(r.json("data.accessToken") || r.json("accessToken")),
  });

  if (!loginOk) {
    metrics.candidatesFailed.add(1);
    return;
  }

  const accessToken = loginRes.json("data.accessToken") || loginRes.json("accessToken");
  const authHeaders = getHeaders(accessToken);

  // -------------------------------------------------------------
  // Step 3: Discovery & Config Lookup (Simulate Candidate Portal Load)
  // -------------------------------------------------------------
  const configsRes = safeGet(`${BASE_URL}/tests/configs`, authHeaders, "configs");
  check(configsRes, {
    "3. Discovery configs available (200)": (r) => r.status === 200,
  });

  // -------------------------------------------------------------
  // Step 4: Assessment Instance Creation (POST /tests/start)
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
  // Step 5: Large Snapshot Manifest Load (GET /tests/:id)
  // -------------------------------------------------------------
  const snapStart = Date.now();
  const snapshotRes = safeGet(`${BASE_URL}/tests/${testInstanceId}`, authHeaders, "snapshot");
  metrics.snapshotDuration.add(Date.now() - snapStart);

  const snapOk = check(snapshotRes, {
    "5. Manifest snapshot loaded (200)": (r) => r.status === 200,
    "5. Sections exist in snapshot": (r) => Array.isArray(r.json("data.sections")) && r.json("data.sections").length > 0,
  });

  if (!snapOk) {
    metrics.candidatesFailed.add(1);
    return;
  }

  const sections = snapshotRes.json("data.sections") || [];
  let totalAnswered = 0;

  // -------------------------------------------------------------
  // Step 6: Multi-Section High Volume Answer Generation
  // -------------------------------------------------------------
  // In a volume test, candidate answers multiple questions across sections (up to 12-16 questions)
  const sectionsToTraverse = sections.slice(0, Math.min(2, sections.length));

  for (let sIdx = 0; sIdx < sectionsToTraverse.length; sIdx++) {
    const section = sectionsToTraverse[sIdx];
    const sectionQuestions = section.questions || [];
    // Answer up to 6 questions per section to build volume
    const questionsToAnswer = sectionQuestions.slice(0, Math.min(6, sectionQuestions.length));

    for (let qIdx = 0; qIdx < questionsToAnswer.length; qIdx++) {
      const q = questionsToAnswer[qIdx];
      const answerChoice = ["A", "B", "C", "D"][(vuId + qIdx + sIdx) % 4];

      const answerPayload = JSON.stringify({
        questionId: q.questionId,
        answer: answerChoice,
        timeSpentSeconds: Math.floor(Math.random() * 15) + 10,
        isMarkedForReview: qIdx === 1,
      });

      const ansStart = Date.now();
      const ansRes = safePost(`${BASE_URL}/tests/${testInstanceId}/answer`, answerPayload, authHeaders, "answer");
      const ansDuration = Date.now() - ansStart;
      metrics.answerDuration.add(ansDuration);

      // Track degradation over test duration as volume builds in DB
      const elapsedSinceStart = Date.now() - testStartEpoch;
      if (elapsedSinceStart < 2 * 60 * 1000) {
        earlyAnswerLatency.add(ansDuration);
      } else {
        sustainedAnswerLatency.add(ansDuration);
      }

      const ansOk = check(ansRes, {
        "6. Volume answer saved (200)": (r) => r.status === 200,
      });

      if (ansOk) {
        metrics.answersSuccess.add(1);
        totalAnswersPersisted.add(1);
        totalAnswered++;
      } else {
        metrics.answersFailed.add(1);
      }

      // Realistic cadence between questions (1.5 - 3.5s)
      sleep(Math.random() * 2 + 1.5);
    }

    // Mid-assessment Section Advance if multiple sections exist
    if (sIdx < sectionsToTraverse.length - 1) {
      const advStart = Date.now();
      const advRes = safePost(`${BASE_URL}/tests/${testInstanceId}/sections/advance`, null, authHeaders, "section_advance");
      metrics.sectionAdvanceDuration.add(Date.now() - advStart);

      check(advRes, {
        "7. Section transition acknowledged (200 or 409)": (r) => r.status === 200 || r.status === 409,
      });

      sleep(1.5);
    }
  }

  // -------------------------------------------------------------
  // Step 7: Telemetry Heartbeat Under Volume
  // -------------------------------------------------------------
  const hbPayload = JSON.stringify({
    currentSectionIndex: Math.min(1, sections.length - 1),
    currentQuestionIndex: 0,
    answeredCount: totalAnswered,
    totalQuestions: 162,
    remainingTimeSeconds: 4800,
    networkStatus: "ONLINE",
    autosaveHealth: "HEALTHY",
  });

  const hbStart = Date.now();
  const hbRes = safePost(`${BASE_URL}/tests/${testInstanceId}/heartbeat`, hbPayload, authHeaders, "heartbeat");
  metrics.heartbeatDuration.add(Date.now() - hbStart);

  check(hbRes, {
    "8. Telemetry heartbeat processed (200)": (r) => r.status === 200,
  });

  sleep(1);

  // -------------------------------------------------------------
  // Step 8: Read Large State (GET /tests/:id/resume)
  // -------------------------------------------------------------
  const resumeRes = safeGet(`${BASE_URL}/tests/${testInstanceId}/resume`, authHeaders, "resume");
  check(resumeRes, {
    "9. Resume state query loaded (200)": (r) => r.status === 200,
    "9. Persisted answers returned in state": (r) => Array.isArray(r.json("answers")),
  });

  // -------------------------------------------------------------
  // Step 9: Final Assessment Submission (POST /tests/:id/submit)
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
    "10. Volume submission successful (200)": (r) => r.status === 200,
    "10. Submission confirmed in payload": (r) => Boolean(r.json("data.submissionId") || r.json("data.status") === "SUBMITTED"),
  });

  if (submitOk) {
    metrics.submissionsSuccess.add(1);
    metrics.candidatesSuccess.add(1);
  } else {
    metrics.submissionsFailed.add(1);
    metrics.candidatesFailed.add(1);
  }

  // -------------------------------------------------------------
  // Step 10: Query Candidate History Under Volume Load
  // -------------------------------------------------------------
  const histStart = Date.now();
  const historyRes = safeGet(`${BASE_URL}/tests/history?page=1&limit=10`, authHeaders, "history");
  historyQueryDuration.add(Date.now() - histStart);

  check(historyRes, {
    "11. History pagination query successful (200)": (r) => r.status === 200,
  });

  // Stagger before next candidate lifecycle
  sleep(Math.random() * 2 + 2);
}

export function handleSummary(data) {
  const report = generateSummaryReport(
    data,
    "Part 3 - Test 2: Qloax Volume Test Report",
    `Volume test with ${targetVus} concurrent candidates generating high volumes of test instances, question manifests, answers, and submissions over ${isQuickRun ? "2 minutes" : volumeDuration}. Measures API and database latency under data accumulation.`
  );

  return {
    stdout: report,
    "load-tests/reports/volume-test-report.md": report,
  };
}
