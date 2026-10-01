import http from "k6/http";
import { check, sleep } from "k6";
import exec from "k6/execution";
import { Counter, Rate, Trend } from "k6/metrics";
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
const SPIKE_VUS = Number(__ENV.SPIKE_VUS) || 75;

// Metrics
const candidatesAttempted = new Counter("day3_t7_candidates_attempted");
const candidatesSuccess = new Counter("day3_t7_candidates_success");
const candidatesFailed = new Counter("day3_t7_candidates_failed");

const spikeSubmissions = new Counter("day3_t7_spike_submissions");
const spikeSubmissionsSuccess = new Counter("day3_t7_spike_submissions_success");
const recoverySubmissionsSuccess = new Counter("day3_t7_recovery_submissions_success");

const errors429 = new Counter("day3_t7_errors_429");
const errors4xx = new Counter("day3_t7_errors_4xx");
const errors5xx = new Counter("day3_t7_errors_5xx");
const netTimeouts = new Counter("day3_t7_timeouts");
const netResets = new Counter("day3_t7_resets");
const netEof = new Counter("day3_t7_eof");
const appErrorRate = new Rate("day3_t7_error_rate");

const spikeReqDuration = new Trend("day3_t7_spike_req_duration_ms");
const recoveryReqDuration = new Trend("day3_t7_recovery_req_duration_ms");
const submitDuration = new Trend("day3_t7_submit_duration_ms");

export const options = {
  dns: {
    ttl: "1h",
    select: "first",
  },
  scenarios: {
    spike_traffic_profile: {
      executor: "ramping-vus",
      startVUs: 10,
      stages: [
        { duration: "45s", target: 10 },        // Phase 1: Baseline steady-state
        { duration: "15s", target: SPIKE_VUS },   // Phase 2: RAPID SPIKE (10 -> SPIKE_VUS in 15s)
        { duration: "2m", target: SPIKE_VUS },    // Phase 3: Hold peak burst
        { duration: "15s", target: 10 },        // Phase 4: Drop back to baseline
        { duration: "1.5m", target: 10 },       // Phase 5: Recovery observation
        { duration: "30s", target: 0 },         // Phase 6: Wind down
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    day3_t7_error_rate: ["rate<0.10"], // Allow up to 10% transient during sudden burst
    day3_t7_submit_duration_ms: ["p(95)<15000"],
    day3_t7_recovery_req_duration_ms: ["p(95)<6000"], // Recovery latency returns to normal
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

function trackStatus(res, endpoint, isSpikePhase) {
  const status = res.status;
  const isErr = status === 0 || status >= 400;
  appErrorRate.add(isErr ? 1 : 0);

  if (isSpikePhase) {
    spikeReqDuration.add(res.timings.duration);
  } else {
    recoveryReqDuration.add(res.timings.duration);
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
  console.log(`[DAY 3 - TEST 7: SPIKE TEST (SUDDEN BURST & RECOVERY)]`);
  console.log(`Target URL:        ${BASE_URL}`);
  console.log(`Assessment ID:     ${ASSESSMENT_ID}`);
  console.log(`Spike Profile:     10 -> ${SPIKE_VUS} VUs in 15 seconds -> Recovery`);
  console.log(`Test Run ID:       ${TEST_RUN_ID}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const vuId = __VU;
  const iter = __ITER;
  const vuCount = exec.instance.vusActive;
  const isSpikePhase = vuCount > 25;

  candidatesAttempted.add(1);
  const candidateEmail = generateCandidateEmail(`d3t7-v${vuId}`, `${iter}-${Date.now()}`);
  let failed = false;

  sleep(Math.random() * 0.4);

  // 1. Signup
  let signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `D3 Spike VU${vuId}-${iter}`,
      referralCode: REFERRAL_CODE,
    }),
    { headers: getHeaders(), tags: { endpoint: "signup" }, timeout: "30s" }
  );
  trackStatus(signupRes, "signup", isSpikePhase);

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
  trackStatus(loginRes, "login", isSpikePhase);

  let accessToken = null;
  try {
    accessToken = loginRes.json("data.accessToken") || loginRes.json("accessToken");
  } catch (_) {}

  if (!accessToken) {
    candidatesFailed.add(1);
    return;
  }

  const authHeaders = getHeaders(accessToken);

  // 3. Start Assessment (Single attempt to prevent duplicate sessions under load)
  let startRes = http.post(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: data.assessmentId }),
    { headers: authHeaders, tags: { endpoint: "start" }, timeout: "60s" }
  );
  trackStatus(startRes, "start", isSpikePhase);

  let testInstanceId = null;
  try {
    testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  } catch (_) {}

  if (!testInstanceId) {
    candidatesFailed.add(1);
    return;
  }

  // 4. Fetch snapshot for question ID
  let snapRes = getWithRetry(`${BASE_URL}/tests/${testInstanceId}`, {
    headers: authHeaders,
    tags: { endpoint: "snapshot" },
    timeout: "30s",
  });
  trackStatus(snapRes, "snapshot", isSpikePhase);

  let qId = "fallback-q1";
  try {
    const sections = snapRes.json("data.sections") || snapRes.json("sections") || [];
    if (sections.length > 0 && sections[0].questions && sections[0].questions.length > 0) {
      qId = sections[0].questions[0].questionId || sections[0].questions[0].id || qId;
    }
  } catch (_) {}

  // 5. Answer question
  let ansRes = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: qId,
      answer: "B",
      timeSpentSeconds: 15,
      isMarkedForReview: false,
    }),
    { headers: authHeaders, tags: { endpoint: "answer" }, timeout: "30s" }
  );
  trackStatus(ansRes, "answer", isSpikePhase);

  // 5. Submit Assessment (Traffic Spike Target)
  spikeSubmissions.add(1);
  const tSub0 = Date.now();
  let submitRes = postWithRetry(
    `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
    null,
    { headers: authHeaders, tags: { endpoint: "submit" }, timeout: "45s" }
  );
  submitDuration.add(Date.now() - tSub0);
  trackStatus(submitRes, "submit", isSpikePhase);

  let submissionId = null;
  try {
    submissionId = submitRes.json("data.submissionId") || submitRes.json("submissionId");
  } catch (_) {}

  const subOk = check(submitRes, {
    "Spike submit returns 200": (r) => r.status === 200,
    "Submission confirmed": () => Boolean(submissionId),
  });

  if (subOk) {
    if (isSpikePhase) {
      spikeSubmissionsSuccess.add(1);
    } else {
      recoverySubmissionsSuccess.add(1);
    }
    candidatesSuccess.add(1);
  } else {
    candidatesFailed.add(1);
  }

  sleep(0.5);
}

export function teardown() {
  console.log(`\n[DAY 3 - TEST 7: SPIKE TEST COMPLETED]`);
}
