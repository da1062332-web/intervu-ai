import http from "k6/http";
import { check, sleep } from "k6";
import exec from "k6/execution";
import { Counter, Rate, Trend, Gauge } from "k6/metrics";
import {
  BASE_URL,
  REFERRAL_CODE,
  ASSESSMENT_ID,
  SIGNUP_PASSWORD,
  TEST_RUN_ID,
  getHeaders,
  generateCandidateEmail,
} from "./common.js";

const TOTAL_CANDIDATES = Number(__ENV.TOTAL_CANDIDATES) || 500;
const PEAK_VUS = Number(__ENV.PEAK_VUS) || 60;

// Metric counters
const candidatesAttempted = new Counter("day3_t6_candidates_attempted");
const candidatesSuccess = new Counter("day3_t6_candidates_success");
const candidatesFailed = new Counter("day3_t6_candidates_failed");

const submissionsAttempted = new Counter("day3_t6_submissions_attempted");
const submissionsSuccess = new Counter("day3_t6_submissions_success");
const submissionsFailed = new Counter("day3_t6_submissions_failed");

const errors429 = new Counter("day3_t6_errors_429");
const errors4xx = new Counter("day3_t6_errors_4xx");
const errors5xx = new Counter("day3_t6_errors_5xx");
const netTimeouts = new Counter("day3_t6_timeouts");
const netResets = new Counter("day3_t6_resets");
const netEof = new Counter("day3_t6_eof");
const appErrorRate = new Rate("day3_t6_error_rate");

// Latency trends across workload stages
const signupDuration = new Trend("day3_t6_signup_duration_ms");
const loginDuration = new Trend("day3_t6_login_duration_ms");
const startTestDuration = new Trend("day3_t6_start_duration_ms");
const answerDuration = new Trend("day3_t6_answer_duration_ms");
const heartbeatDuration = new Trend("day3_t6_heartbeat_duration_ms");
const submitDuration = new Trend("day3_t6_submit_duration_ms");
const totalCandidateDuration = new Trend("day3_t6_total_duration_ms");

export const options = {
  dns: {
    ttl: "1h",
    select: "first",
  },
  scenarios: {
    stress_ramp_workload: {
      executor: "ramping-vus",
      startVUs: 10,
      stages: [
        { duration: "1m", target: 20 },  // Stage 1: Initial ramp to 20 VUs
        { duration: "2m", target: 35 },  // Stage 2: Medium stress at 35 VUs
        { duration: "2m", target: 50 },  // Stage 3: High stress at 50 VUs
        { duration: "2m", target: PEAK_VUS }, // Stage 4: Peak stress at target VUs
        { duration: "1m", target: 15 },  // Stage 5: Ramp down
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    day3_t6_error_rate: ["rate<0.08"], // < 8% error rate allowed under extreme multi-stage stress
    day3_t6_submit_duration_ms: ["p(95)<15000"],
    day3_t6_answer_duration_ms: ["p(95)<7000"],
    day3_t6_heartbeat_duration_ms: ["p(95)<5000"],
  },
};

function postWithRetry(url, payload, params, maxRetries = 2) {
  let res;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    res = http.post(url, payload, params);
    if (res.status === 200 || res.status === 201) {
      return res;
    }
    if (res.status === 0 || res.status === 408 || res.status === 429 || res.status >= 500) {
      if (attempt < maxRetries) {
        sleep(1.5 * (attempt + 1));
        continue;
      }
    }
    break;
  }
  return res;
}

function getWithRetry(url, params, maxRetries = 2) {
  let res;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    res = http.get(url, params);
    if (res.status === 200) {
      return res;
    }
    if (res.status === 0 || res.status === 408 || res.status === 429 || res.status >= 500) {
      if (attempt < maxRetries) {
        sleep(1.5 * (attempt + 1));
        continue;
      }
    }
    break;
  }
  return res;
}

function trackStatus(res, endpoint) {
  const status = res.status;
  const isErr = status === 0 || status >= 400;
  appErrorRate.add(isErr ? 1 : 0);

  if (status === 429) {
    errors429.add(1);
  } else if (status >= 400 && status < 500) {
    errors4xx.add(1);
  } else if (status >= 500) {
    errors5xx.add(1);
  } else if (status === 0) {
    const errMsg = (res.error || "").toLowerCase();
    if (errMsg.includes("timeout") || errMsg.includes("deadline")) {
      netTimeouts.add(1);
    } else if (errMsg.includes("reset") || errMsg.includes("connection reset")) {
      netResets.add(1);
    } else if (errMsg.includes("eof")) {
      netEof.add(1);
    } else {
      netTimeouts.add(1);
    }
  }
}

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[DAY 3 - TEST 6: STRESS TEST (GRADUAL CONCURRENCY RAMP)]`);
  console.log(`Target URL:         ${BASE_URL}`);
  console.log(`Assessment ID:      ${ASSESSMENT_ID}`);
  console.log(`Workload Target:    ~${TOTAL_CANDIDATES} candidates across ramp`);
  console.log(`Peak Concurrency:   ${PEAK_VUS} active concurrent VUs`);
  console.log(`Test Run ID:        ${TEST_RUN_ID}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const vuId = __VU;
  const iter = __ITER;
  const vuStart = Date.now();
  candidatesAttempted.add(1);

  const candidateEmail = generateCandidateEmail(`d3t6-v${vuId}`, `${iter}-${Date.now()}`);
  let failed = false;

  // Stagger launch to prevent client packet lock
  sleep(Math.random() * 1.0);

  // 1. Candidate Signup
  const tSign0 = Date.now();
  let signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `D3 Stress VU${vuId}-${iter}`,
      referralCode: REFERRAL_CODE,
    }),
    { headers: getHeaders(), tags: { endpoint: "signup" }, timeout: "30s" }
  );
  signupDuration.add(Date.now() - tSign0);
  trackStatus(signupRes, "signup");

  const signupOk = check(signupRes, {
    "Signup valid (200/201)": (r) => r.status === 200 || r.status === 201,
  });

  if (!signupOk) {
    candidatesFailed.add(1);
    return;
  }

  // 2. Candidate Login
  const tLog0 = Date.now();
  let loginRes = postWithRetry(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
    }),
    { headers: getHeaders(), tags: { endpoint: "login" }, timeout: "30s" }
  );
  loginDuration.add(Date.now() - tLog0);
  trackStatus(loginRes, "login");

  let accessToken = null;
  try {
    accessToken = loginRes.json("data.accessToken") || loginRes.json("accessToken");
  } catch (_) {}

  const loginOk = check(loginRes, {
    "Login returns valid (200/201)": (r) => r.status === 200 || r.status === 201,
    "Access token received": () => Boolean(accessToken),
  });

  if (!loginOk || !accessToken) {
    candidatesFailed.add(1);
    return;
  }

  const authHeaders = getHeaders(accessToken);

  // 3. Start Assessment Instance
  const tStart0 = Date.now();
  let startRes = postWithRetry(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: data.assessmentId }),
    { headers: authHeaders, tags: { endpoint: "start" }, timeout: "45s" }
  );
  startTestDuration.add(Date.now() - tStart0);
  trackStatus(startRes, "start");

  let testInstanceId = null;
  try {
    testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  } catch (_) {}

  const startOk = check(startRes, {
    "Start returns 200": (r) => r.status === 200,
    "Test instance ID valid": () => Boolean(testInstanceId),
  });

  if (!startOk || !testInstanceId) {
    candidatesFailed.add(1);
    return;
  }

  // 4. Fetch Question Snapshot
  let snapRes = getWithRetry(`${BASE_URL}/tests/${testInstanceId}`, {
    headers: authHeaders,
    tags: { endpoint: "snapshot" },
    timeout: "30s",
  });
  trackStatus(snapRes, "snapshot");

  let qId = "fallback-q1";
  try {
    const sections = snapRes.json("data.sections") || snapRes.json("sections") || [];
    if (sections.length > 0 && sections[0].questions && sections[0].questions.length > 0) {
      qId = sections[0].questions[0].questionId || sections[0].questions[0].id || qId;
    }
  } catch (_) {}

  // 5. Save Answer
  const tAns0 = Date.now();
  let ansRes = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: qId,
      answer: ["A", "B", "C", "D"][(vuId + iter) % 4],
      timeSpentSeconds: 25,
      isMarkedForReview: false,
    }),
    { headers: authHeaders, tags: { endpoint: "answer" }, timeout: "30s" }
  );
  answerDuration.add(Date.now() - tAns0);
  trackStatus(ansRes, "answer");

  // 6. Send Telemetry Heartbeat
  const tHb0 = Date.now();
  let hbRes = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/heartbeat`,
    JSON.stringify({
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      answeredCount: 1,
      totalQuestions: 60,
      remainingTimeSeconds: 7200,
      networkStatus: "ONLINE",
      autosaveHealth: "HEALTHY",
    }),
    { headers: authHeaders, tags: { endpoint: "heartbeat" }, timeout: "30s" }
  );
  heartbeatDuration.add(Date.now() - tHb0);
  trackStatus(hbRes, "heartbeat");

  // 7. Assessment Submission
  submissionsAttempted.add(1);
  const tSub0 = Date.now();
  let submitRes = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
    null,
    { headers: authHeaders, tags: { endpoint: "submit" }, timeout: "45s" }
  );
  submitDuration.add(Date.now() - tSub0);
  trackStatus(submitRes, "submit");

  let submissionId = null;
  try {
    submissionId = submitRes.json("data.submissionId") || submitRes.json("submissionId");
  } catch (_) {}

  const subOk = check(submitRes, {
    "Submit returns 200": (r) => r.status === 200,
    "Submission ID confirmed": () => Boolean(submissionId),
  });

  if (subOk) {
    submissionsSuccess.add(1);
  } else {
    submissionsFailed.add(1);
    failed = true;
  }

  totalCandidateDuration.add(Date.now() - vuStart);

  if (!failed) {
    candidatesSuccess.add(1);
  } else {
    candidatesFailed.add(1);
  }

  sleep(0.5);
}

export function teardown() {
  console.log(`\n[DAY 3 - TEST 6: STRESS TEST COMPLETED]`);
}
