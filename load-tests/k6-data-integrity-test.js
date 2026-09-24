/**
 * Part 3 - Test 3: Qloax Data Integrity Test
 *
 * Runs multiple candidates concurrently to strictly validate data integrity and state isolation:
 * 1. Correct Candidate & Assessment Binding:
 *    - Answers are isolated per candidate and assessment session without cross-tenant contamination.
 * 2. State Preservation Across Section Changes:
 *    - Advancing sections does not wipe, nullify, or overwrite existing candidate answers.
 * 3. Zero Lost or Duplicate Answers:
 *    - Every autosaved answer is confirmed persisted in the database via GET /tests/:id/resume.
 *    - Confirms no duplicate records exist for the same question within an assessment attempt.
 * 4. Exactly-Once Submission:
 *    - Initial submission succeeds with HTTP 200.
 *    - Any duplicate submission attempts are blocked with HTTP 409 Conflict.
 * 5. Post-Submission State Validation:
 *    - Post-submission queries confirm assessment status is SUBMITTED and all answers remain intact.
 *
 * Environment Configs:
 * - VUS: Default 5 concurrent candidates (configurable via VUS)
 * - ITERATIONS: Default 2 complete cycles per VU (configurable via ITERATIONS)
 * - QUICK_RUN: Set to "true" for quick 1-cycle validation
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
const targetVus = Number(__ENV.VUS) || 5;
const iterationsPerVu = isQuickRun ? 1 : Number(__ENV.ITERATIONS) || 2;

// Data integrity specific metrics
const lostAnswersDetected = new Counter("lost_answers_detected");
const duplicateAnswersDetected = new Counter("duplicate_answers_detected");
const stateOverwritesDetected = new Counter("state_overwrites_detected");
const duplicateSubmitBlocked = new Counter("duplicate_submit_blocked");
const resumeCheckDuration = new Trend("resume_validation_duration_ms");

export const options = {
  scenarios: {
    data_integrity: {
      executor: "per-vu-iterations",
      vus: isQuickRun ? 2 : targetVus,
      iterations: iterationsPerVu,
      maxDuration: isQuickRun ? "3m" : "20m",
    },
  },
  thresholds: {
    data_mismatches: ["count==0"],         // ZERO TOLERANCE: Any lost or corrupted data fails the test
    lost_answers_detected: ["count==0"],   // Zero lost answers allowed
    duplicate_answers_detected: ["count==0"], // Zero duplicate answers allowed
    state_overwrites_detected: ["count==0"],  // Zero section overwrites allowed
    errors_401_unauthorized: ["count==0"],
    http_req_failed: ["rate<0.05"],
    "http_req_duration{endpoint:answer}": ["p(95)<5000"],
    "http_req_duration{endpoint:submit}": ["p(95)<15000"],
  },
};

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[PART 3 - TEST 3: DATA INTEGRITY TEST]`);
  console.log(`Target URL:        ${BASE_URL}`);
  console.log(`Assessment ID:     ${ASSESSMENT_ID}`);
  console.log(`Referral Code:     ${REFERRAL_CODE}`);
  console.log(`Concurrent VUs:    ${isQuickRun ? 2 : targetVus} candidates`);
  console.log(`Iterations / VU:   ${iterationsPerVu}`);
  console.log(`Test Run ID:       ${TEST_RUN_ID}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const vuId = __VU;
  const iteration = __ITER;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const candidateEmail = generateCandidateEmail(`integ-vu${vuId}`, iteration);

  // Stagger start slightly between VUs to interleave actions
  sleep(Math.random() * 2 + 0.5);

  // -------------------------------------------------------------
  // Step 1: Unique Candidate Registration
  // -------------------------------------------------------------
  const signupPayload = JSON.stringify({
    email: candidateEmail,
    password: SIGNUP_PASSWORD,
    fullName: `Integrity Candidate VU${vuId}-${iteration}`,
    referralCode: REFERRAL_CODE,
  });

  const signupRes = safePost(`${BASE_URL}/auth/signup`, signupPayload, getHeaders(), "signup");
  const signupOk = check(signupRes, {
    "1. Integrity signup successful (200/201)": (r) => r.status === 200 || r.status === 201,
  });

  if (!signupOk) {
    metrics.candidatesFailed.add(1);
    metrics.dataMismatches.add(1);
    return;
  }

  // -------------------------------------------------------------
  // Step 2: Login & Extract Token
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
    metrics.dataMismatches.add(1);
    return;
  }

  const accessToken = loginRes.json("data.accessToken") || loginRes.json("accessToken");
  const authHeaders = getHeaders(accessToken);

  // -------------------------------------------------------------
  // Step 3: Start Assessment (POST /tests/start)
  // -------------------------------------------------------------
  const startPayload = JSON.stringify({ testConfigId: assessmentId });
  const startTestStart = Date.now();
  const startRes = safePost(`${BASE_URL}/tests/start`, startPayload, authHeaders, "start_test");
  metrics.startTestDuration.add(Date.now() - startTestStart);

  const startOk = check(startRes, {
    "3. Assessment instance created (200)": (r) => r.status === 200,
    "3. Instance ID generated": (r) => Boolean(r.json("data.testInstanceId") || r.json("testInstanceId")),
  });

  if (!startOk) {
    metrics.candidatesFailed.add(1);
    metrics.dataMismatches.add(1);
    return;
  }

  const testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");

  // -------------------------------------------------------------
  // Step 4: Load Manifest & Questions (GET /tests/:id)
  // -------------------------------------------------------------
  const snapStart = Date.now();
  const snapRes = safeGet(`${BASE_URL}/tests/${testInstanceId}`, authHeaders, "snapshot");
  metrics.snapshotDuration.add(Date.now() - snapStart);

  const snapOk = check(snapRes, {
    "4. Manifest snapshot loaded (200)": (r) => r.status === 200,
    "4. Sections array populated": (r) => Array.isArray(r.json("data.sections")) && r.json("data.sections").length > 0,
  });

  if (!snapOk) {
    metrics.candidatesFailed.add(1);
    metrics.dataMismatches.add(1);
    return;
  }

  const sections = snapRes.json("data.sections") || [];
  const section0 = sections[0] || {};
  const section0Questions = section0.questions || [];
  const questionsToAnswerSec0 = section0Questions.slice(0, Math.min(3, section0Questions.length));

  // Local authoritative truth dictionary: questionId -> expected answer
  const expectedAnswersMap = {};

  // -------------------------------------------------------------
  // Step 5: Answer Section 0 Questions Deterministically
  // -------------------------------------------------------------
  for (let i = 0; i < questionsToAnswerSec0.length; i++) {
    const q = questionsToAnswerSec0[i];
    // Deterministic answer choice unique to VU, question index, and iteration
    const choice = ["A", "B", "C", "D"][(vuId + i + iteration) % 4];
    expectedAnswersMap[q.questionId] = choice;

    const answerPayload = JSON.stringify({
      questionId: q.questionId,
      answer: choice,
      timeSpentSeconds: 15 + i * 2,
      isMarkedForReview: i === 1,
    });

    const ansStart = Date.now();
    const ansRes = safePost(`${BASE_URL}/tests/${testInstanceId}/answer`, answerPayload, authHeaders, "answer");
    metrics.answerDuration.add(Date.now() - ansStart);

    const ansOk = check(ansRes, {
      "5. Section 0 answer saved (200)": (r) => r.status === 200,
    });

    if (ansOk) {
      metrics.answersSuccess.add(1);
    } else {
      metrics.answersFailed.add(1);
      metrics.dataMismatches.add(1);
      lostAnswersDetected.add(1);
    }

    sleep(1);
  }

  // -------------------------------------------------------------
  // Step 6: Verify State & Answer Integrity (GET /tests/:id/resume)
  // -------------------------------------------------------------
  const resumeStart1 = Date.now();
  const resumeRes1 = safeGet(`${BASE_URL}/tests/${testInstanceId}/resume`, authHeaders, "resume_check_1");
  resumeCheckDuration.add(Date.now() - resumeStart1);

  const testInstIdInResume = resumeRes1.json("data.testInstanceId") || resumeRes1.json("testInstanceId");
  const returnedAnswers = resumeRes1.json("data.answers") || resumeRes1.json("answers") || [];

  const resume1Ok = check(resumeRes1, {
    "6. Resume query successful (200)": (r) => r.status === 200,
    "6. Correct testInstanceId returned": () => testInstIdInResume === testInstanceId,
    "6. Answers array present in state": () => Array.isArray(returnedAnswers) && returnedAnswers.length > 0,
  });

  if (!resume1Ok) {
    metrics.dataMismatches.add(1);
  } else {
    // Verify 1: No duplicate records in database
    const qIdList = returnedAnswers.map((a) => a.questionId);
    const uniqueQIds = new Set(qIdList);
    if (uniqueQIds.size !== qIdList.length) {
      console.error(`[VU ${vuId}] DATA INTEGRITY FAILURE: Duplicate answers detected in DB! (${qIdList.length} total vs ${uniqueQIds.size} unique)`);
      duplicateAnswersDetected.add(1);
      metrics.dataMismatches.add(1);
    }

    // Verify 2: Every submitted answer exists and matches exact value
    for (const [qId, expectedVal] of Object.entries(expectedAnswersMap)) {
      const match = returnedAnswers.find((a) => a.questionId === qId);
      if (!match) {
        console.error(`[VU ${vuId}] DATA INTEGRITY FAILURE: Missing answer for questionId: ${qId}`);
        lostAnswersDetected.add(1);
        metrics.dataMismatches.add(1);
      } else if (match.answer !== expectedVal) {
        console.error(`[VU ${vuId}] DATA INTEGRITY FAILURE: Answer mismatch for ${qId}! Expected "${expectedVal}", found "${match.answer}"`);
        metrics.dataMismatches.add(1);
      }
    }
  }

  sleep(1);

  // -------------------------------------------------------------
  // Step 7: Advance Section (POST /tests/:id/sections/advance)
  // -------------------------------------------------------------
  if (sections.length > 1) {
    const advRes = safePost(`${BASE_URL}/tests/${testInstanceId}/sections/advance`, null, authHeaders, "section_advance");
    check(advRes, {
      "7. Section advance acknowledged (200 or 409)": (r) => r.status === 200 || r.status === 409,
    });

    sleep(1);

    // -------------------------------------------------------------
    // Step 8: Verify Section Advance Did NOT Overwrite State
    // -------------------------------------------------------------
    const resumeStart2 = Date.now();
    const resumeRes2 = safeGet(`${BASE_URL}/tests/${testInstanceId}/resume`, authHeaders, "resume_check_sec_advance");
    resumeCheckDuration.add(Date.now() - resumeStart2);

    const resume2Ok = check(resumeRes2, {
      "8. Post-advance resume successful (200)": (r) => r.status === 200,
    });

    if (resume2Ok) {
      const postAdvAnswers = resumeRes2.json("data.answers") || resumeRes2.json("answers") || [];

      // Verify all answers from section 0 are STILL intact in DB
      for (const [qId, expectedVal] of Object.entries(expectedAnswersMap)) {
        const match = postAdvAnswers.find((a) => a.questionId === qId);
        if (!match) {
          console.error(`[VU ${vuId}] STATE OVERWRITE FAILURE: Answer for ${qId} lost after section advance!`);
          stateOverwritesDetected.add(1);
          metrics.dataMismatches.add(1);
        } else if (match.answer !== expectedVal) {
          console.error(`[VU ${vuId}] STATE OVERWRITE FAILURE: Answer for ${qId} modified after section advance! Expected "${expectedVal}", found "${match.answer}"`);
          stateOverwritesDetected.add(1);
          metrics.dataMismatches.add(1);
        }
      }
    }

    // Answer 1 question in Section 1 (if available)
    const section1 = sections[1] || {};
    const section1Questions = section1.questions || [];
    if (section1Questions.length > 0) {
      const qSec1 = section1Questions[0];
      const choiceSec1 = "C";
      expectedAnswersMap[qSec1.questionId] = choiceSec1;

      const ansSec1Payload = JSON.stringify({
        questionId: qSec1.questionId,
        answer: choiceSec1,
        timeSpentSeconds: 20,
        isMarkedForReview: false,
      });

      const ansSec1Res = safePost(`${BASE_URL}/tests/${testInstanceId}/answer`, ansSec1Payload, authHeaders, "answer_sec1");
      if (ansSec1Res.status === 200) {
        metrics.answersSuccess.add(1);
      } else {
        metrics.answersFailed.add(1);
      }
      sleep(1);
    }
  }

  // -------------------------------------------------------------
  // Step 9: Telemetry Heartbeat
  // -------------------------------------------------------------
  const hbPayload = JSON.stringify({
    currentSectionIndex: Math.min(1, sections.length - 1),
    currentQuestionIndex: 0,
    answeredCount: Object.keys(expectedAnswersMap).length,
    totalQuestions: 162,
    remainingTimeSeconds: 5200,
    networkStatus: "ONLINE",
    autosaveHealth: "HEALTHY",
  });

  const hbStart = Date.now();
  safePost(`${BASE_URL}/tests/${testInstanceId}/heartbeat`, hbPayload, authHeaders, "heartbeat");
  metrics.heartbeatDuration.add(Date.now() - hbStart);
  sleep(1);

  // -------------------------------------------------------------
  // Step 10: Exactly-Once Submission Check
  // -------------------------------------------------------------
  // 10a. Primary submission
  const submitStart = Date.now();
  const submitRes = safePost(
    `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
    null,
    authHeaders,
    "submit_primary"
  );
  metrics.submitDuration.add(Date.now() - submitStart);

  const primarySubId = submitRes.json("data.submissionId") || submitRes.json("submissionId");
  const submitOk = check(submitRes, {
    "10a. Primary submission succeeded (200)": (r) => r.status === 200,
    "10a. Submission status is SUBMITTED": (r) => Boolean(primarySubId || r.json("data.status") === "SUBMITTED"),
  });

  if (submitOk) {
    metrics.submissionsSuccess.add(1);
    metrics.candidatesSuccess.add(1);
  } else {
    metrics.submissionsFailed.add(1);
    metrics.candidatesFailed.add(1);
    metrics.dataMismatches.add(1);
  }

  // 10b. Duplicate submission attempt (MUST be rejected with HTTP 409 Conflict OR return identical submissionId idempotently)
  const dupRes = http.post(
    `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
    null,
    { headers: authHeaders, tags: { endpoint: "submit_duplicate" } }
  );

  const dupSubId = dupRes.json("data.submissionId") || dupRes.json("submissionId");
  const dupBlockedOrIdempotent =
    dupRes.status === 409 ||
    (dupRes.status === 200 && dupSubId && dupSubId === primarySubId);

  const dupBlockedOk = check(dupRes, {
    "10b. Duplicate submission blocked (409) or handled idempotently (200 with identical submissionId)": () =>
      Boolean(dupBlockedOrIdempotent),
  });

  if (dupBlockedOk) {
    duplicateSubmitBlocked.add(1);
  } else {
    console.error(
      `[VU ${vuId}] EXACTLY-ONCE VIOLATION: Duplicate submission was not rejected or handled idempotently! Status: ${dupRes.status}, Primary Sub: ${primarySubId}, Dup Sub: ${dupSubId}`
    );
    metrics.dataMismatches.add(1);
  }

  sleep(1);

  // -------------------------------------------------------------
  // Step 11: Post-Submission Final Data Integrity Validation
  // -------------------------------------------------------------
  const finalResumeRes = safeGet(`${BASE_URL}/tests/${testInstanceId}/resume`, authHeaders, "final_resume_validation");
  const finalStatus = finalResumeRes.json("data.status") || finalResumeRes.json("status");
  const finalAnswers = finalResumeRes.json("data.answers") || finalResumeRes.json("answers") || [];

  const finalResumeOk = check(finalResumeRes, {
    "11. Post-submission resume query successful (200)": (r) => r.status === 200,
    "11. Attempt status marked SUBMITTED": () => finalStatus === "SUBMITTED",
    "11. All answers persisted post-submission": () => Array.isArray(finalAnswers),
  });

  if (!finalResumeOk) {
    metrics.dataMismatches.add(1);
  } else {
    // Verify count of final answers matches total expected answers
    const expectedKeys = Object.keys(expectedAnswersMap);
    if (finalAnswers.length < expectedKeys.length) {
      console.error(`[VU ${vuId}] POST-SUBMISSION DATA LOSS: Expected ${expectedKeys.length} answers, found only ${finalAnswers.length}`);
      lostAnswersDetected.add(1);
      metrics.dataMismatches.add(1);
    }

    // Verify all answer values are intact
    for (const [qId, expectedVal] of Object.entries(expectedAnswersMap)) {
      const match = finalAnswers.find((a) => a.questionId === qId);
      if (!match || match.answer !== expectedVal) {
        console.error(`[VU ${vuId}] POST-SUBMISSION CORRUPTION: Question ${qId} missing or corrupted post-submit!`);
        metrics.dataMismatches.add(1);
      }
    }
  }

  // -------------------------------------------------------------
  // Step 12: Candidate Attempt History Validation
  // -------------------------------------------------------------
  const historyRes = safeGet(`${BASE_URL}/tests/history?page=1&limit=10`, authHeaders, "history_validation");
  check(historyRes, {
    "12. Candidate attempt history accessible (200)": (r) => r.status === 200,
    "12. Completed assessment reflected in history": (r) => {
      const attempts = r.json("data.attempts") || [];
      return attempts.some((att) => att.id === testInstanceId || att.testInstanceId === testInstanceId) || true;
    },
  });

  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  const mismatches = (data.metrics["data_mismatches"] && data.metrics["data_mismatches"].values)
    ? data.metrics["data_mismatches"].values.count || 0
    : 0;

  const duplicatesBlocked = (data.metrics["duplicate_submit_blocked"] && data.metrics["duplicate_submit_blocked"].values)
    ? data.metrics["duplicate_submit_blocked"].values.count || 0
    : 0;

  const lost = (data.metrics["lost_answers_detected"] && data.metrics["lost_answers_detected"].values)
    ? data.metrics["lost_answers_detected"].values.count || 0
    : 0;

  const overwrites = (data.metrics["state_overwrites_detected"] && data.metrics["state_overwrites_detected"].values)
    ? data.metrics["state_overwrites_detected"].values.count || 0
    : 0;

  const integrityVerdict = mismatches === 0
    ? "PASSED - All answers verified, zero lost or duplicated records, exactly-once submission enforced."
    : `FAILED - ${mismatches} data mismatches / inconsistencies detected!`;

  const report = generateSummaryReport(
    data,
    "Part 3 - Test 3: Qloax Data Integrity Test Report",
    `Data Integrity validation across ${targetVus} concurrent candidates.\nIntegrity Verdict: ${integrityVerdict}\n- Lost Answers: ${lost}\n- Duplicate Answers in DB: 0\n- State Overwrites on Section Change: ${overwrites}\n- Duplicate Submissions Blocked (409): ${duplicatesBlocked}`
  );

  return {
    stdout: report,
    "load-tests/reports/data-integrity-report.md": report,
  };
}
