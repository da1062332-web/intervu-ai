import http from "k6/http";
import { check, sleep } from "k6";
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

const MAX_VUS = Number(__ENV.MAX_VUS) || Number(__ENV.VUS) || 500;
const RAMP_WINDOW_SEC = Number(__ENV.RAMP_WINDOW_SEC) || 500;
const ANSWERS_PER_CANDIDATE = 4;

// Metrics
const candidatesAttempted = new Counter("day2_t2_candidates_attempted");
const candidatesSuccess = new Counter("day2_t2_candidates_success");
const candidatesFailed = new Counter("day2_t2_candidates_failed");

const answersAttempted = new Counter("day2_t2_answers_attempted");
const answersSuccess = new Counter("day2_t2_answers_success");
const answersLost = new Counter("day2_t2_answers_lost");

const errors429 = new Counter("day2_t2_errors_429");
const errors4xx = new Counter("day2_t2_errors_4xx");
const errors5xx = new Counter("day2_t2_errors_5xx");
const netTimeouts = new Counter("day2_t2_timeouts");
const netResets = new Counter("day2_t2_resets");
const netEof = new Counter("day2_t2_eof");
const appErrorRate = new Rate("day2_t2_error_rate");

const autosaveDuration = new Trend("day2_t2_autosave_duration_ms");
const totalCandidateDuration = new Trend("day2_t2_total_duration_ms");

export const options = {
  dns: {
    ttl: "1h",
    select: "first",
  },
  scenarios: {
    day2_answer_autosave: {
      executor: "per-vu-iterations",
      vus: MAX_VUS,
      iterations: 1,
      maxDuration: "16m",
    },
  },
  thresholds: {
    day2_t2_error_rate: ["rate<0.05"],
    day2_t2_autosave_duration_ms: ["p(95)<10000"],
    day2_t2_candidates_success: [`count>=${MAX_VUS}`],
    day2_t2_answers_success: [`count>=${MAX_VUS * ANSWERS_PER_CANDIDATE}`],
  },
};

function postWithRetry(url, payload, params, maxRetries = 3) {
  let res;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    res = http.post(url, payload, params);
    if (res.status === 200 || res.status === 201) {
      return res;
    }
    if (res.status === 0 || res.status === 408 || res.status === 429 || res.status >= 500) {
      if (attempt < maxRetries) {
        sleep(2.0 * (attempt + 1));
        continue;
      }
    }
    break;
  }
  return res;
}

function getWithRetry(url, params, maxRetries = 3) {
  let res;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    res = http.get(url, params);
    if (res.status === 200) {
      return res;
    }
    if (res.status === 0 || res.status === 408 || res.status === 429 || res.status >= 500) {
      if (attempt < maxRetries) {
        sleep(2.0 * (attempt + 1));
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

  if (status === 0) {
    errors5xx.add(1);
    const errStr = String(res.error || "");
    if (errStr.includes("timeout") || errStr.includes("deadline")) {
      netTimeouts.add(1);
    } else if (errStr.includes("reset") || errStr.includes("forcibly closed")) {
      netResets.add(1);
    } else if (errStr.includes("EOF")) {
      netEof.add(1);
    }
    console.error(`[VU ${__VU}] [NET ERROR status 0] on ${endpoint}: ${errStr}`);
  } else if (status === 429) {
    errors429.add(1);
    errors4xx.add(1);
    console.error(`[VU ${__VU}] [HTTP 429] on ${endpoint}: ${res.body}`);
  } else if (status >= 400 && status < 500) {
    errors4xx.add(1);
    console.error(`[VU ${__VU}] [HTTP ${status}] on ${endpoint}: ${res.body}`);
  } else if (status >= 500) {
    errors5xx.add(1);
    console.error(`[VU ${__VU}] [HTTP ${status}] on ${endpoint}: ${res.body}`);
  }
}

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[DAY 2 - TEST 2: ANSWER AUTOSAVE CONCURRENCY TEST]`);
  console.log(`Target Base URL:       ${BASE_URL}`);
  console.log(`Assessment ID:         ${ASSESSMENT_ID}`);
  console.log(`Candidates (VUs):      ${MAX_VUS}`);
  console.log(`Arrival Ramp Window:   ${RAMP_WINDOW_SEC}s`);
  console.log(`Answers / Candidate:   ${ANSWERS_PER_CANDIDATE} (Total: ${MAX_VUS * ANSWERS_PER_CANDIDATE})`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const vuId = __VU;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const vuStart = Date.now();
  candidatesAttempted.add(1);

  // Stagger arrival across ramp window
  const arrivalStaggerSec = MAX_VUS > 1 ? (vuId - 1) * (RAMP_WINDOW_SEC / MAX_VUS) : 0;
  if (arrivalStaggerSec > 0) {
    sleep(arrivalStaggerSec);
  }

  const candidateEmail = generateCandidateEmail(`d2-t2-vu${vuId}`, vuId);
  let failed = false;

  // 1. Candidate Registration
  let signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `Day2 Autosave Candidate VU${vuId}`,
      referralCode: REFERRAL_CODE,
    }),
    { headers: getHeaders(), tags: { endpoint: "signup" }, timeout: "60s" }
  );
  trackStatus(signupRes, "signup");

  let accessToken = null;
  try {
    accessToken = signupRes.json("data.accessToken") || signupRes.json("accessToken");
  } catch (_) {}

  if (!accessToken) {
    candidatesFailed.add(1);
    return;
  }

  const authHeaders = getHeaders(accessToken);

  // 2. Start Assessment
  let startRes = postWithRetry(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: assessmentId }),
    { headers: authHeaders, tags: { endpoint: "start" }, timeout: "90s" }
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

  // 3. Assessment Fetch to extract target question IDs
  let fetchRes = getWithRetry(`${BASE_URL}/tests/${testInstanceId}`, {
    headers: authHeaders,
    tags: { endpoint: "assessment_fetch" },
    timeout: "60s",
  });
  trackStatus(fetchRes, "assessment_fetch");

  let sections = null;
  try {
    sections = fetchRes.json("data.sections");
  } catch (_) {}

  // Flatten question pool from sections
  const questionsList = [];
  if (Array.isArray(sections)) {
    sections.forEach((sec) => {
      if (Array.isArray(sec.questions)) {
        sec.questions.forEach((q) => {
          questionsList.push(q.questionId || q.id);
        });
      }
    });
  }

  // 4. Sequential Answer Autosaves with Human Think Times
  let candidateAnswersSaved = 0;
  for (let i = 0; i < ANSWERS_PER_CANDIDATE; i++) {
    // Select distinct question for each answer slot
    const targetQId = questionsList[i] || `question-${i + 1}`;
    const choice = ["A", "B", "C", "D"][(vuId + i) % 4];

    answersAttempted.add(1);
    const tAns0 = Date.now();
    let ansRes = postWithRetry(
      `${BASE_URL}/tests/${testInstanceId}/answer`,
      JSON.stringify({
        questionId: targetQId,
        answer: choice,
        timeSpentSeconds: 15 + i * 5,
        isMarkedForReview: i === 2,
      }),
      { headers: authHeaders, tags: { endpoint: "answer_autosave" }, timeout: "45s" }
    );
    const ansDur = Date.now() - tAns0;
    autosaveDuration.add(ansDur);
    trackStatus(ansRes, "answer_autosave");

    const ansOk = check(ansRes, {
      "Answer autosave returns 200": (r) => r.status === 200,
    });

    if (ansOk) {
      answersSuccess.add(1);
      candidateAnswersSaved++;
    } else {
      answersLost.add(1);
      failed = true;
    }

    // Realistic candidate pacing between answers
    sleep(1.0);
  }

  totalCandidateDuration.add(Date.now() - vuStart);

  if (!failed && candidateAnswersSaved === ANSWERS_PER_CANDIDATE) {
    candidatesSuccess.add(1);
  } else {
    candidatesFailed.add(1);
  }
}

export function handleSummary(data) {
  const getVal = (name) => data.metrics[name]?.values?.count ?? 0;
  const getLat = (name) => {
    const v = data.metrics[name]?.values;
    if (!v) return { med: "0ms", p90: "0ms", p95: "0ms", p99: "0ms", max: "0ms", avg: "0ms" };
    return {
      med: `${Math.round(v.med || 0)}ms`,
      p90: `${Math.round(v["p(90)"] || 0)}ms`,
      p95: `${Math.round(v["p(95)"] || 0)}ms`,
      p99: `${Math.round(v["p(99)"] || 0)}ms`,
      max: `${Math.round(v.max || 0)}ms`,
      avg: `${Math.round(v.avg || 0)}ms`,
    };
  };

  const attempted = getVal("day2_t2_candidates_attempted");
  const success = getVal("day2_t2_candidates_success");
  const failed = getVal("day2_t2_candidates_failed");
  const ansAttempted = getVal("day2_t2_answers_attempted");
  const ansSuccess = getVal("day2_t2_answers_success");
  const ansLost = getVal("day2_t2_answers_lost");

  const err429 = getVal("day2_t2_errors_429");
  const err4xx = getVal("day2_t2_errors_4xx");
  const err5xx = getVal("day2_t2_errors_5xx");
  const timeouts = getVal("day2_t2_timeouts");
  const resets = getVal("day2_t2_resets");
  const eof = getVal("day2_t2_eof");
  const errRate = ((data.metrics.day2_t2_error_rate?.values?.rate ?? 0) * 100).toFixed(2);

  const ansLat = getLat("day2_t2_autosave_duration_ms");
  const totalLat = getLat("day2_t2_total_duration_ms");

  const report = `
================================================================================
# Qloax Day 2 - Test 2: Answer Autosave Report
================================================================================
Generated:                  ${new Date().toISOString()}
Target Environment:         ${BASE_URL}
Assessment ID:              ${ASSESSMENT_ID}
Candidates Attempted:       ${attempted}
Successful Candidates:      ${success}
Failed Candidates:          ${failed}
Error Rate:                 ${errRate}%

--------------------------------------------------------------------------------
## 1. HTTP Status & Error Breakdown
- HTTP 429 (Rate Limited):  ${err429}
- HTTP 4xx (Client Errors): ${err4xx}
- HTTP 5xx (Server Drops):  ${err5xx}
- Timeouts:                 ${timeouts}
- Connection Resets:        ${resets}
- Stream EOF:               ${eof}

--------------------------------------------------------------------------------
## 2. Answer Autosave Operations
- Total Answers Attempted:  ${ansAttempted}
- Total Answers Persisted:  ${ansSuccess}
- Total Lost Answers:       ${ansLost}
- Persistence Rate:         ${ansAttempted > 0 ? ((ansSuccess / ansAttempted) * 100).toFixed(2) : "0"}%

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Answer Autosave (/answer)  | ${ansLat.med.padEnd(8)} | ${ansLat.p95.padEnd(8)} | ${ansLat.p99.padEnd(8)} | ${ansLat.max.padEnd(8)} | ${ansLat.avg.padEnd(8)} |
| Total Candidate Flow       | ${totalLat.med.padEnd(8)} | ${totalLat.p95.padEnd(8)} | ${totalLat.p99.padEnd(8)} | ${totalLat.max.padEnd(8)} | ${totalLat.avg.padEnd(8)} |
================================================================================
`;

  return {
    stdout: report,
    "load-tests/reports/day2-test2-answer-autosave-report.md": report,
  };
}
