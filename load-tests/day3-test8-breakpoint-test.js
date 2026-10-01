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

const MAX_TARGET_VUS = Number(__ENV.MAX_TARGET_VUS) || 120;

// Breakpoint Tracking Metrics
const candidatesAttempted = new Counter("day3_t8_candidates_attempted");
const candidatesSuccess = new Counter("day3_t8_candidates_success");
const candidatesFailed = new Counter("day3_t8_candidates_failed");

const activeVUsGauge = new Gauge("day3_t8_active_vus");
const breakpointViolations = new Counter("day3_t8_sla_violations");

const errors429 = new Counter("day3_t8_errors_429");
const errors4xx = new Counter("day3_t8_errors_4xx");
const errors5xx = new Counter("day3_t8_errors_5xx");
const netTimeouts = new Counter("day3_t8_timeouts");
const netResets = new Counter("day3_t8_resets");
const netEof = new Counter("day3_t8_eof");
const appErrorRate = new Rate("day3_t8_error_rate");

const stepLatencyTrend = new Trend("day3_t8_step_req_duration_ms");
const submitDuration = new Trend("day3_t8_submit_duration_ms");
const answerDuration = new Trend("day3_t8_answer_duration_ms");

export const options = {
  dns: {
    ttl: "1h",
    select: "first",
  },
  scenarios: {
    breakpoint_stepped_load: {
      executor: "ramping-vus",
      startVUs: 15,
      stages: [
        { duration: "45s", target: 15 },
        { duration: "45s", target: 30 },
        { duration: "1m", target: 50 },
        { duration: "1m", target: 75 },
        { duration: "1m", target: 100 },
        { duration: "1.5m", target: MAX_TARGET_VUS },
        { duration: "45s", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    day3_t8_error_rate: ["rate<0.15"], // Breakpoint warning threshold
    day3_t8_submit_duration_ms: ["p(95)<20000"],
    day3_t8_answer_duration_ms: ["p(95)<10000"],
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
        sleep(1.0 * (attempt + 1));
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
  stepLatencyTrend.add(res.timings.duration);

  if (res.timings.duration > 8000) {
    breakpointViolations.add(1);
  }

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
  console.log(`[DAY 3 - TEST 8: BREAKPOINT & CAPACITY THRESHOLD TEST]`);
  console.log(`Target URL:        ${BASE_URL}`);
  console.log(`Assessment ID:     ${ASSESSMENT_ID}`);
  console.log(`Stepping Profile:  15 -> 30 -> 50 -> 75 -> 100 -> ${MAX_TARGET_VUS} VUs`);
  console.log(`Test Run ID:       ${TEST_RUN_ID}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const vuId = __VU;
  const iter = __ITER;
  const currentVUs = exec.instance.vusActive;
  activeVUsGauge.add(currentVUs);

  candidatesAttempted.add(1);
  const candidateEmail = generateCandidateEmail(`d3t8-v${vuId}`, `${iter}-${Date.now()}`);
  let failed = false;

  sleep(Math.random() * 0.3);

  // 1. Signup
  let signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `D3 BP VU${vuId}-${iter}`,
      referralCode: REFERRAL_CODE,
    }),
    { headers: getHeaders(), tags: { endpoint: "signup" }, timeout: "30s" }
  );
  trackStatus(signupRes, "signup");

  if (signupRes.status !== 200 && signupRes.status !== 201) {
    candidatesFailed.add(1);
    return;
  }

  // 2. Login
  let loginRes = postWithRetry(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
    }),
    { headers: getHeaders(), tags: { endpoint: "login" }, timeout: "30s" }
  );
  trackStatus(loginRes, "login");

  let accessToken = null;
  try {
    accessToken = loginRes.json("data.accessToken") || loginRes.json("accessToken");
  } catch (_) {}

  if (!accessToken) {
    candidatesFailed.add(1);
    return;
  }

  const authHeaders = getHeaders(accessToken);

  // 3. Start Assessment (Single attempt with 60s timeout to prevent race condition under load)
  let startRes = http.post(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: data.assessmentId }),
    { headers: authHeaders, tags: { endpoint: "start" }, timeout: "60s" }
  );
  trackStatus(startRes, "start");

  let testInstanceId = null;
  try {
    testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  } catch (_) {}

  if (!testInstanceId) {
    candidatesFailed.add(1);
    return;
  }

  // 4. Fetch Question Snapshot
  let snapRes = http.get(`${BASE_URL}/tests/${testInstanceId}`, {
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

  // 5. Autosave Answer
  const tAns0 = Date.now();
  let ansRes = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: qId,
      answer: "A",
      timeSpentSeconds: 20,
      isMarkedForReview: false,
    }),
    { headers: authHeaders, tags: { endpoint: "answer" }, timeout: "30s" }
  );
  answerDuration.add(Date.now() - tAns0);
  trackStatus(ansRes, "answer");

  // 5. Submit Assessment
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
    "Submit status 200": (r) => r.status === 200,
    "Submission confirmed": () => Boolean(submissionId),
  });

  if (subOk) {
    candidatesSuccess.add(1);
  } else {
    candidatesFailed.add(1);
    failed = true;
  }

  sleep(0.5);
}

export function teardown() {
  console.log(`\n[DAY 3 - TEST 8: BREAKPOINT TEST COMPLETED]`);
}
