/**
 * Part 1 - Test 2: Qloax Concurrency & Stress Test
 *
 * Simulates 10–20 candidates simultaneously executing assessment actions:
 * 1. Concurrent Signups + Logins with unique dummy emails
 * 2. Simultaneous Assessment Starts and Manifest Loads
 * 3. Interleaved, concurrent Answer Autosaves across multiple questions
 * 4. Concurrent Section Advances (detecting race conditions / out-of-order transitions)
 * 5. Concurrent Telemetry Heartbeats
 * 6. Intentional Duplicate Submission test (ensures race prevention & idempotency/409 handling)
 * 7. Measures p95/p99 latency, 4xx, 5xx, and candidate completion rates under load.
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";
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
} from "./common.js";

const VUS = Number(__ENV.VUS) || 10; // 10 candidates by default, scale up to 20 via -e VUS=20
const TEST_DURATION_MINS = Number(__ENV.TEST_DURATION_MINS) || 2; // Duration of concurrent activity

// Dedicated concurrency metrics
const lostAnswersDetected = new Counter("concurrency_lost_answers");
const raceConditionsDetected = new Counter("concurrency_race_conditions");
const duplicateSubmitBlocked = new Counter("concurrency_duplicate_submit_blocked");

export const options = {
  scenarios: {
    concurrent_candidates: {
      executor: "per-vu-iterations",
      vus: VUS,
      iterations: 1,
      maxDuration: "10m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"], // Allow <5% transient errors under concurrency
    "http_req_duration{endpoint:answer}": ["p(95)<5000"],
    "http_req_duration{endpoint:heartbeat}": ["p(95)<5000"],
    "http_req_duration{endpoint:start_test}": ["p(95)<30000"],
    "http_req_duration{endpoint:submit}": ["p(95)<12000"],
    errors_5xx: ["count<5"],
    errors_401_unauthorized: ["count==0"],
    errors_403_forbidden: ["count==0"],
    submissions_success: [`count>=${VUS}`],
  },
};

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[TEST 2: CONCURRENCY TEST] Initializing concurrency test`);
  console.log(`Target Base URL:        ${BASE_URL}`);
  console.log(`Assessment ID:          ${ASSESSMENT_ID}`);
  console.log(`Referral Code:          ${REFERRAL_CODE}`);
  console.log(`Concurrent Candidates:  ${VUS} VUs`);
  console.log(`Test Run ID:            ${TEST_RUN_ID}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const vuId = __VU;
  const iteration = __ITER;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const candidateEmail = generateCandidateEmail(`conc-vu${vuId}`, iteration);
  const startTime = Date.now();

  // Natural arrival stagger (1.5s per VU) to simulate real-world candidate arrival ramp-up
  const arrivalStaggerSec = (vuId - 1) * 1.5;
  if (arrivalStaggerSec > 0) {
    sleep(arrivalStaggerSec);
  }

  console.log(`[VU ${vuId} | Iter ${iteration}] Candidate arrived & starting (${candidateEmail})`);

  // -------------------------------------------------------------
  // Phase 1: Concurrent Registration & Authentication
  // -------------------------------------------------------------
  const signupPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
    fullName: `Concurrent Candidate VU${vuId}-${iteration}`,
    referralCode: REFERRAL_CODE,
  });

  const signupRes = safePost(`${BASE_URL}/auth/signup`, signupPayload, getHeaders(), "signup");
  const signupOk = check(signupRes, {
    "Signup succeeded (200/201)": (r) => r.status === 200 || r.status === 201,
  });

  if (!signupOk) {
    console.error(`[VU ${vuId}] Concurrency signup failed: ${signupRes.status}`);
    metrics.candidatesFailed.add(1);
    return;
  }

  // Login to acquire clean access token
  const loginPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
  });

  const loginStart = Date.now();
  const loginRes = safePost(`${BASE_URL}/auth/login`, loginPayload, getHeaders(), "login");
  metrics.loginDuration.add(Date.now() - loginStart);

  const loginOk = check(loginRes, {
    "Login succeeded (200/201)": (r) => r.status === 200 || r.status === 201,
    "Access token extracted": (r) => Boolean(r.json("data.accessToken") || r.json("accessToken")),
  });

  if (!loginOk) {
    console.error(`[VU ${vuId}] Concurrency login failed: ${loginRes.status}`);
    metrics.candidatesFailed.add(1);
    return;
  }

  const accessToken = loginRes.json("data.accessToken") || loginRes.json("accessToken");
  const authHeaders = getHeaders(accessToken);
  sleep(1);

  // -------------------------------------------------------------
  // Phase 2: Start Assessment Concurrently
  // -------------------------------------------------------------
  const startStart = Date.now();
  const startRes = safePost(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: assessmentId }),
    authHeaders,
    "start_test"
  );
  metrics.startTestDuration.add(Date.now() - startStart);

  const startOk = check(startRes, {
    "Assessment started (200)": (r) => r.status === 200,
    "Instance ID generated": (r) => Boolean(r.json("data.testInstanceId") || r.json("testInstanceId")),
  });

  if (!startOk) {
    console.error(`[VU ${vuId}] Concurrent start test failed: ${startRes.status}`);
    metrics.candidatesFailed.add(1);
    return;
  }

  const testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  console.log(`[VU ${vuId}] Assessment instance created: ${testInstanceId}`);

  // Load Manifest
  const snapStart = Date.now();
  const snapRes = safeGet(`${BASE_URL}/tests/${testInstanceId}`, authHeaders, "snapshot");
  metrics.snapshotDuration.add(Date.now() - snapStart);

  const snapOk = check(snapRes, {
    "Snapshot loaded concurrently (200)": (r) => r.status === 200,
    "Sections available in snapshot": (r) => Array.isArray(r.json("data.sections")),
  });

  if (!snapOk) {
    console.error(`[VU ${vuId}] Concurrent snapshot failed: ${snapRes.status}`);
    metrics.candidatesFailed.add(1);
    return;
  }

  const sections = snapRes.json("data.sections") || [];
  const questionPool = [];
  sections.forEach((sec, sIdx) => {
    (sec.questions || []).forEach((q, qIdx) => {
      questionPool.push({
        sectionIndex: sIdx,
        questionId: q.questionId,
      });
    });
  });

  // -------------------------------------------------------------
  // Phase 3: Concurrent Answer Autosaves & Section Changes
  // -------------------------------------------------------------
  const poolSize = Math.max(questionPool.length, 10);
  let savedAnswersCount = 0;
  let currentSectionIdx = 0;

  // Interleave 6-8 answer submissions with realistic think time (2–4s)
  const answersToSubmit = Math.min(8, poolSize);
  for (let a = 0; a < answersToSubmit; a++) {
    const qTarget = questionPool[a] || { questionId: `q-${a}` };
    const answerChoice = ["A", "B", "C", "D"][(vuId + a) % 4];

    const answerPayload = JSON.stringify({
      questionId: qTarget.questionId,
      answer: answerChoice,
      timeSpentSeconds: Math.floor(Math.random() * 8) + 5,
      isMarkedForReview: a === 2,
    });

    const ansStart = Date.now();
    const ansRes = safePost(`${BASE_URL}/tests/${testInstanceId}/answer`, answerPayload, authHeaders, "answer");
    metrics.answerDuration.add(Date.now() - ansStart);

    const ansOk = check(ansRes, {
      "Concurrent answer saved (200)": (r) => r.status === 200,
    });

    if (ansOk) {
      savedAnswersCount++;
    } else {
      lostAnswersDetected.add(1);
      console.warn(`[VU ${vuId}] Possible lost answer on ${qTarget.questionId}: HTTP ${ansRes.status}`);
    }

    // Mid-test section advance check at answer 3
    if (a === 3) {
      const advStart = Date.now();
      const advRes = safePost(`${BASE_URL}/tests/${testInstanceId}/sections/advance`, null, authHeaders, "section_advance");
      metrics.sectionAdvanceDuration.add(Date.now() - advStart);

      const advOk = check(advRes, {
        "Concurrent section advance valid (200 or 409)": (r) => r.status === 200 || r.status === 409,
      });

      if (advOk && advRes.status === 200) {
        currentSectionIdx++;
      } else if (advRes.status >= 500) {
        raceConditionsDetected.add(1);
      }
    }

    // Heartbeat check at answer 5
    if (a === 5) {
      const hbPayload = JSON.stringify({
        currentSectionIndex: currentSectionIdx,
        currentQuestionIndex: a,
        answeredCount: savedAnswersCount,
        totalQuestions: poolSize,
        remainingTimeSeconds: 5000,
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
      });
      const hbStart = Date.now();
      const hbRes = safePost(`${BASE_URL}/tests/${testInstanceId}/heartbeat`, hbPayload, authHeaders, "heartbeat");
      metrics.heartbeatDuration.add(Date.now() - hbStart);

      check(hbRes, {
        "Concurrent telemetry heartbeat OK (200)": (r) => r.status === 200,
      });
    }

    // Realistic human cadence
    sleep(Math.random() * 2 + 2);
  }

  // -------------------------------------------------------------
  // Phase 4: Final Submission & Duplicate Submit Race Prevention
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
    "Primary submission succeeded (200)": (r) => r.status === 200,
    "Submission confirmed in payload": (r) => Boolean(r.json("data.submissionId") || r.json("data.status") === "SUBMITTED"),
  });

  if (submitOk) {
    metrics.submissionsSuccess.add(1);
    metrics.candidatesSuccess.add(1);
    console.log(`[VU ${vuId}] Primary submission completed successfully for ${testInstanceId}`);

    // Race Condition Check: Attempt duplicate submission immediately
    // Should be safely rejected or handled with HTTP 409 (already submitted)
    const dupRes = http.post(
      `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
      null,
      { headers: authHeaders, tags: { endpoint: "submit_duplicate" } }
    );

    const dupBlocked = check(dupRes, {
      "Duplicate submit blocked or handled idempotently (409 or 200)": (r) => r.status === 409 || r.status === 200,
    });

    if (dupBlocked && dupRes.status === 409) {
      duplicateSubmitBlocked.add(1);
      console.log(`[VU ${vuId}] Duplicate submission correctly rejected with HTTP 409`);
    }
  } else {
    metrics.submissionsFailed.add(1);
    metrics.candidatesFailed.add(1);
    console.error(`[VU ${vuId}] Concurrent submission failed: ${submitRes.status} - ${submitRes.body?.slice(0, 200)}`);
  }
}
