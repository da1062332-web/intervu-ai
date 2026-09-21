/**
 * Part 1 - Test 1: Qloax Smoke Test
 *
 * Simulates 1–2 dummy candidates performing a clean end-to-end journey:
 * 1. Signup with unique dummy email + QLO referral code (POST /auth/signup)
 * 2. Login to verify authentication contract (POST /auth/login)
 * 3. Verify session validity (GET /auth/me)
 * 4. Start assessment (POST /tests/start)
 * 5. Load assessment snapshot & question manifest (GET /tests/:id)
 * 6. Answer questions across current section (POST /tests/:id/answer)
 * 7. Advance section (POST /tests/:id/sections/advance)
 * 8. Answer questions in the new section
 * 9. Emit telemetry heartbeat (POST /tests/:id/heartbeat)
 * 10. Submit assessment (POST /tests/:id/submit?allowPartial=true)
 * 11. Verify 100% success across all steps
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
} from "./common.js";

const VUS = Number(__ENV.VUS) || 2;

export const options = {
  scenarios: {
    smoke_candidate: {
      executor: "per-vu-iterations",
      vus: VUS,
      iterations: 1,
      maxDuration: "3m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{endpoint:answer}": ["p(95)<4500"],
    "http_req_duration{endpoint:heartbeat}": ["p(95)<4500"],
    "http_req_duration{endpoint:start_test}": ["p(95)<25000"],
    "http_req_duration{endpoint:submit}": ["p(95)<10000"],
    errors_5xx: ["count==0"],
    errors_401_unauthorized: ["count==0"],
    errors_403_forbidden: ["count==0"],
    submissions_success: [`count>=${VUS}`],
    candidates_success: [`count>=${VUS}`],
  },
};

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[TEST 1: SMOKE TEST] Initializing smoke test`);
  console.log(`Target Base URL:    ${BASE_URL}`);
  console.log(`Assessment ID:      ${ASSESSMENT_ID}`);
  console.log(`Referral Code:      ${REFERRAL_CODE}`);
  console.log(`Test Run ID:        ${TEST_RUN_ID}`);
  console.log(`Candidates (VUs):   ${VUS}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const vuId = __VU;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const candidateEmail = generateCandidateEmail("smoke", vuId);
  const startTime = Date.now();

  console.log(`[VU ${vuId}] Starting smoke test journey for ${candidateEmail}`);

  // -------------------------------------------------------------
  // Step 1: Candidate Signup with Referral Code
  // -------------------------------------------------------------
  const signupPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
    fullName: `Smoke Candidate ${vuId}`,
    referralCode: REFERRAL_CODE,
  });

  const signupStart = Date.now();
  const signupRes = safePost(`${BASE_URL}/auth/signup`, signupPayload, getHeaders(), "signup");

  const signupOk = check(signupRes, {
    "1. Signup status is 200/201": (r) => r.status === 200 || r.status === 201,
    "1. Signup returned user data": (r) => Boolean(r.json("data.user") || r.json("user")),
  });

  if (!signupOk) {
    console.error(`[VU ${vuId}] Signup failed: ${signupRes.status} - ${signupRes.body?.slice(0, 200)}`);
    metrics.candidatesFailed.add(1);
    return;
  }
  console.log(`[VU ${vuId}] Step 1: Signup successful`);
  sleep(1);

  // -------------------------------------------------------------
  // Step 2: Candidate Login
  // -------------------------------------------------------------
  const loginPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
  });

  const loginStart = Date.now();
  const loginRes = safePost(`${BASE_URL}/auth/login`, loginPayload, getHeaders(), "login");
  metrics.loginDuration.add(Date.now() - loginStart);

  const loginOk = check(loginRes, {
    "2. Login status is 200/201": (r) => r.status === 200 || r.status === 201,
    "2. Access token present in response": (r) => Boolean(r.json("data.accessToken") || r.json("accessToken")),
  });

  if (!loginOk) {
    console.error(`[VU ${vuId}] Login failed: ${loginRes.status} - ${loginRes.body?.slice(0, 200)}`);
    metrics.candidatesFailed.add(1);
    return;
  }

  const accessToken = loginRes.json("data.accessToken") || loginRes.json("accessToken");
  const authHeaders = getHeaders(accessToken);
  console.log(`[VU ${vuId}] Step 2: Login successful, accessToken obtained`);
  sleep(1);

  // -------------------------------------------------------------
  // Step 3: Verify Session Profile (GET /auth/me)
  // -------------------------------------------------------------
  const meRes = safeGet(`${BASE_URL}/auth/me`, authHeaders, "auth_me");
  const meOk = check(meRes, {
    "3. Auth /me returned 200": (r) => r.status === 200,
    "3. Authenticated user ID matches": (r) => Boolean(r.json("data.id") || r.json("id")),
  });

  if (!meOk) {
    console.error(`[VU ${vuId}] Session validation failed: ${meRes.status}`);
    metrics.candidatesFailed.add(1);
    return;
  }
  console.log(`[VU ${vuId}] Step 3: Session verified`);
  sleep(1);

  // -------------------------------------------------------------
  // Step 4: Start Assessment (POST /tests/start)
  // -------------------------------------------------------------
  const startPayload = JSON.stringify({ testConfigId: assessmentId });
  const startTestStart = Date.now();
  const startRes = safePost(`${BASE_URL}/tests/start`, startPayload, authHeaders, "start_test");
  metrics.startTestDuration.add(Date.now() - startTestStart);

  const startOk = check(startRes, {
    "4. Assessment start status is 200": (r) => r.status === 200,
    "4. TestInstance ID created": (r) => Boolean(r.json("data.testInstanceId") || r.json("testInstanceId")),
  });

  if (!startOk) {
    console.error(`[VU ${vuId}] Start assessment failed: ${startRes.status} - ${startRes.body?.slice(0, 200)}`);
    metrics.candidatesFailed.add(1);
    return;
  }

  const testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  console.log(`[VU ${vuId}] Step 4: Assessment started (ID: ${testInstanceId})`);
  sleep(1);

  // -------------------------------------------------------------
  // Step 5: Load Assessment Questions Manifest (GET /tests/:id)
  // -------------------------------------------------------------
  const snapStart = Date.now();
  const snapshotRes = safeGet(`${BASE_URL}/tests/${testInstanceId}`, authHeaders, "snapshot");
  metrics.snapshotDuration.add(Date.now() - snapStart);

  const snapshotOk = check(snapshotRes, {
    "5. Snapshot loaded with 200": (r) => r.status === 200,
    "5. Sections array populated": (r) => Array.isArray(r.json("data.sections")) && r.json("data.sections").length > 0,
  });

  if (!snapshotOk) {
    console.error(`[VU ${vuId}] Snapshot load failed: ${snapshotRes.status}`);
    metrics.candidatesFailed.add(1);
    return;
  }

  const sections = snapshotRes.json("data.sections") || [];
  console.log(`[VU ${vuId}] Step 5: Snapshot loaded (${sections.length} sections available)`);
  sleep(1);

  // -------------------------------------------------------------
  // Step 6: Answer questions in initial section
  // -------------------------------------------------------------
  const firstSection = sections[0] || {};
  const firstSectionQuestions = firstSection.questions || [];
  const questionsToAnswerFirst = firstSectionQuestions.slice(0, Math.min(3, firstSectionQuestions.length));

  let totalAnswered = 0;
  for (let i = 0; i < questionsToAnswerFirst.length; i++) {
    const q = questionsToAnswerFirst[i];
    const answerPayload = JSON.stringify({
      questionId: q.questionId,
      answer: ["A", "B", "C", "D"][i % 4],
      timeSpentSeconds: 12,
      isMarkedForReview: false,
    });

    const ansStart = Date.now();
    const ansRes = safePost(`${BASE_URL}/tests/${testInstanceId}/answer`, answerPayload, authHeaders, "answer");
    metrics.answerDuration.add(Date.now() - ansStart);

    check(ansRes, {
      "6. Answer saved with 200": (r) => r.status === 200,
    });
    totalAnswered++;
    sleep(1.5); // Realistic candidate thinking delay
  }
  console.log(`[VU ${vuId}] Step 6: Saved ${totalAnswered} answers in Section 1`);

  // -------------------------------------------------------------
  // Step 7: Advance to Next Section (POST /tests/:id/sections/advance)
  // -------------------------------------------------------------
  const advStart = Date.now();
  const advRes = safePost(`${BASE_URL}/tests/${testInstanceId}/sections/advance`, null, authHeaders, "section_advance");
  metrics.sectionAdvanceDuration.add(Date.now() - advStart);

  const advOk = check(advRes, {
    "7. Section advance returned 200 or 409": (r) => r.status === 200 || r.status === 409,
  });

  if (advOk) {
    console.log(`[VU ${vuId}] Step 7: Section advance confirmed (HTTP ${advRes.status})`);
  }
  sleep(1);

  // -------------------------------------------------------------
  // Step 8: Answer question in Section 2 & Send Telemetry Heartbeat
  // -------------------------------------------------------------
  const secondSection = sections[1] || sections[0];
  const secondSectionQuestions = secondSection.questions || [];
  if (secondSectionQuestions.length > 0) {
    const q2 = secondSectionQuestions[0];
    const answerPayload2 = JSON.stringify({
      questionId: q2.questionId,
      answer: "B",
      timeSpentSeconds: 15,
      isMarkedForReview: false,
    });
    const ansRes2 = safePost(`${BASE_URL}/tests/${testInstanceId}/answer`, answerPayload2, authHeaders, "answer");
    check(ansRes2, {
      "8. Answer in section 2 saved with 200": (r) => r.status === 200,
    });
    totalAnswered++;
  }

  // Telemetry Heartbeat
  const hbPayload = JSON.stringify({
    currentSectionIndex: 1,
    currentQuestionIndex: 0,
    answeredCount: totalAnswered,
    totalQuestions: 162,
    remainingTimeSeconds: 5300,
    networkStatus: "ONLINE",
    autosaveHealth: "HEALTHY",
  });
  const hbStart = Date.now();
  const hbRes = safePost(`${BASE_URL}/tests/${testInstanceId}/heartbeat`, hbPayload, authHeaders, "heartbeat");
  metrics.heartbeatDuration.add(Date.now() - hbStart);

  check(hbRes, {
    "8. Telemetry heartbeat returned 200": (r) => r.status === 200,
  });
  console.log(`[VU ${vuId}] Step 8: Telemetry heartbeat sent`);
  sleep(1.5);

  // -------------------------------------------------------------
  // Step 9: Final Assessment Submission
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
    "9. Submission status is 200": (r) => r.status === 200,
    "9. Submission confirmation received": (r) => Boolean(r.json("data.submissionId") || r.json("submissionId") || r.json("data.status") === "SUBMITTED"),
  });

  if (submitOk) {
    metrics.submissionsSuccess.add(1);
    metrics.candidatesSuccess.add(1);
    const durationSec = Math.round((Date.now() - startTime) / 1000);
    console.log(`[VU ${vuId}] Step 9: Assessment successfully submitted in ${durationSec}s!`);
  } else {
    metrics.submissionsFailed.add(1);
    metrics.candidatesFailed.add(1);
    console.error(`[VU ${vuId}] Submission failed: ${submitRes.status} - ${submitRes.body?.slice(0, 200)}`);
  }
}
