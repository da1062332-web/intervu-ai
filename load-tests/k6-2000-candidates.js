/**
 * Load test: 2,000 concurrent candidates sitting a real assessment.
 *
 * This exercises the actual public API end-to-end — auth, starting an
 * attempt, repeated autosave, and (for a fraction of virtual users) a real
 * Judge0 coding submission — instead of hitting Judge0 or any internal
 * service directly. That distinction matters: every load script already in
 * this repo (scratch/sustained-load.js, scratch/burst-test.js) bypasses
 * auth and the API and tops out at 100 simulated users, so none of them
 * answer "can the deployed system handle 2,000 real candidates."
 *
 * Run against STAGING, not production — this creates real candidate
 * accounts and real assessment attempts.
 *
 *   k6 run \
 *     -e BASE_URL=https://staging.skillitrix.com/api/v1 \
 *     -e TEST_CONFIG_ID=<a real, published test config UUID> \
 *     -e CODING_QUESTION_ID=<optional: a real coding question ID> \
 *     -e SIGNUP_PASSWORD='LoadTest#2000' \
 *     -e MAX_VUS=2000 \
 *     load-tests/k6-2000-candidates.js
 *
 * Install k6: https://k6.io/docs/get-started/installation/ (not an npm
 * package — it's a standalone Go binary, run via the `k6` CLI).
 */

import http from "k6/http";
import { check, sleep, fail } from "k6";
import { Counter, Trend } from "k6/metrics";

const BASE_URL = (__ENV.BASE_URL || "http://localhost:10000/api/v1").replace(/\/+$/, "");
const TEST_CONFIG_ID = __ENV.TEST_CONFIG_ID || "";
const CODING_QUESTION_ID = __ENV.CODING_QUESTION_ID || "";
const SIGNUP_PASSWORD = __ENV.SIGNUP_PASSWORD || "LoadTest#2000!";
const MAX_VUS = Number(__ENV.MAX_VUS) || 2000;
// Fraction of virtual users that also exercise a coding submission —
// mirrors real usage where only some assessments/questions are coding-based.
const CODING_VU_FRACTION = Number(__ENV.CODING_VU_FRACTION) || 0.2;
const AUTOSAVE_ROUNDS = Number(__ENV.AUTOSAVE_ROUNDS) || 6;

const submitFailures = new Counter("assessment_submit_failures");
const codeExecFailures = new Counter("code_execution_failures");
const codeExecDuration = new Trend("code_execution_duration_ms");
const capacityRejections = new Counter("http_503_capacity_rejections");

export const options = {
  scenarios: {
    exam_takers: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: Math.round(MAX_VUS * 0.25) }, // candidates trickling in
        { duration: "3m", target: MAX_VUS }, // everyone arrives near the start window
        { duration: "8m", target: MAX_VUS }, // sustained exam-taking load
        { duration: "2m", target: 0 }, // deadline: mass submit
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    // Fewer than 1% of all requests should error outright.
    http_req_failed: ["rate<0.01"],
    // The exam-taking path (login/start/autosave/submit) should stay responsive.
    "http_req_duration{endpoint:autosave}": ["p(95)<2000"],
    "http_req_duration{endpoint:submit}": ["p(95)<5000"],
    assessment_submit_failures: ["count<1"],
  },
};

function must(res, expectedStatus, label) {
  const ok = check(res, {
    [`${label} status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
  });
  if (res.status === 503) capacityRejections.add(1);
  if (!ok) {
    console.error(`${label} failed: ${res.status} ${res.body?.slice?.(0, 300)}`);
  }
  return ok;
}

function signupAndLogin(vuTag) {
  const email = `loadtest-${vuTag}-${Date.now()}@skillitrix-loadtest.invalid`;
  const signupRes = http.post(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email,
      password: SIGNUP_PASSWORD,
      fullName: `Load Test Candidate ${vuTag}`,
    }),
    { headers: { "Content-Type": "application/json" }, tags: { endpoint: "signup" } },
  );

  let accessToken;
  if (signupRes.status === 200 || signupRes.status === 201) {
    accessToken = signupRes.json("accessToken") || signupRes.json("data.accessToken");
  }

  if (!accessToken) {
    // Account may already exist from a previous run — fall back to login.
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email, password: SIGNUP_PASSWORD }),
      { headers: { "Content-Type": "application/json" }, tags: { endpoint: "login" } },
    );
    if (!must(loginRes, 200, "login")) return null;
    accessToken = loginRes.json("accessToken") || loginRes.json("data.accessToken");
  }

  return accessToken;
}

function startAssessment(authHeaders) {
  const res = http.post(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: TEST_CONFIG_ID }),
    { headers: authHeaders, tags: { endpoint: "start" } },
  );
  if (!must(res, 200, "start-test")) return null;
  return res.json("data.testInstanceId") || res.json("testInstanceId");
}

function autosaveAnswer(authHeaders, testInstanceId, questionId, iteration) {
  const res = http.post(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId,
      answer: `load-test-answer-${iteration}`,
      timeSpentSeconds: 5,
      isMarkedForReview: false,
    }),
    { headers: authHeaders, tags: { endpoint: "autosave" } },
  );
  must(res, 200, "autosave");
}

function runCodingSubmission(authHeaders, testInstanceId) {
  if (!CODING_QUESTION_ID) return;

  const sampleCode =
    "def solution(*args):\n    return args[0] if args else None\n";

  const runRes = http.post(
    `${BASE_URL}/coding/run`,
    JSON.stringify({
      questionId: CODING_QUESTION_ID,
      testInstanceId,
      code: sampleCode,
      language: "python",
    }),
    { headers: authHeaders, tags: { endpoint: "coding_run" } },
  );
  if (runRes.status !== 200 && runRes.status !== 503) codeExecFailures.add(1);
  if (runRes.status === 503) capacityRejections.add(1);

  const submitStart = Date.now();
  const submitRes = http.post(
    `${BASE_URL}/coding/submit`,
    JSON.stringify({
      questionId: CODING_QUESTION_ID,
      testInstanceId,
      code: sampleCode,
      language: "python",
    }),
    { headers: authHeaders, tags: { endpoint: "coding_submit" }, timeout: "120s" },
  );
  codeExecDuration.add(Date.now() - submitStart);
  if (submitRes.status !== 200 && submitRes.status !== 503) codeExecFailures.add(1);
  if (submitRes.status === 503) capacityRejections.add(1);
}

function submitAssessment(authHeaders, testInstanceId) {
  const res = http.post(
    `${BASE_URL}/tests/${testInstanceId}/submit`,
    null,
    { headers: authHeaders, tags: { endpoint: "submit" } },
  );
  if (!must(res, 200, "submit")) submitFailures.add(1);
}

export function setup() {
  if (!TEST_CONFIG_ID) {
    fail(
      "TEST_CONFIG_ID env var is required — pass a real, published test config UUID from your staging environment.",
    );
  }
}

export default function () {
  const vuTag = `${__VU}-${__ITER}`;
  const accessToken = signupAndLogin(vuTag);
  if (!accessToken) return;

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const testInstanceId = startAssessment(authHeaders);
  if (!testInstanceId) return;

  // Simulate a candidate working through questions with autosave firing
  // periodically, the same way the real frontend does.
  for (let i = 0; i < AUTOSAVE_ROUNDS; i++) {
    autosaveAnswer(authHeaders, testInstanceId, `loadtest-question-${i}`, i);
    sleep(Math.random() * 3 + 2); // 2-5s between answers, like a real candidate
  }

  // A fraction of candidates also run/submit a coding question.
  if (CODING_QUESTION_ID && Math.random() < CODING_VU_FRACTION) {
    runCodingSubmission(authHeaders, testInstanceId);
  }

  submitAssessment(authHeaders, testInstanceId);
}
