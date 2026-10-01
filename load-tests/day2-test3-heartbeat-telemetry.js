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
const HEARTBEATS_PER_CANDIDATE = 3;

// Metrics
const candidatesAttempted = new Counter("day2_t3_candidates_attempted");
const candidatesSuccess = new Counter("day2_t3_candidates_success");
const candidatesFailed = new Counter("day2_t3_candidates_failed");

const heartbeatsAttempted = new Counter("day2_t3_heartbeats_attempted");
const heartbeatsSuccess = new Counter("day2_t3_heartbeats_success");
const heartbeatsDropped = new Counter("day2_t3_heartbeats_dropped");

const errors429 = new Counter("day2_t3_errors_429");
const errors4xx = new Counter("day2_t3_errors_4xx");
const errors5xx = new Counter("day2_t3_errors_5xx");
const netTimeouts = new Counter("day2_t3_timeouts");
const netResets = new Counter("day2_t3_resets");
const netEof = new Counter("day2_t3_eof");
const appErrorRate = new Rate("day2_t3_error_rate");

const heartbeatDuration = new Trend("day2_t3_heartbeat_duration_ms");
const totalCandidateDuration = new Trend("day2_t3_total_duration_ms");

export const options = {
  dns: {
    ttl: "1h",
    select: "first",
  },
  scenarios: {
    day2_heartbeat_telemetry: {
      executor: "per-vu-iterations",
      vus: MAX_VUS,
      iterations: 1,
      maxDuration: "16m",
    },
  },
  thresholds: {
    day2_t3_error_rate: ["rate<0.05"],
    day2_t3_heartbeat_duration_ms: ["p(95)<10000"],
    day2_t3_candidates_success: [`count>=${MAX_VUS}`],
    day2_t3_heartbeats_success: [`count>=${MAX_VUS * HEARTBEATS_PER_CANDIDATE}`],
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
  console.log(`[DAY 2 - TEST 3: HEARTBEAT & TELEMETRY TEST]`);
  console.log(`Target Base URL:       ${BASE_URL}`);
  console.log(`Assessment ID:         ${ASSESSMENT_ID}`);
  console.log(`Candidates (VUs):      ${MAX_VUS}`);
  console.log(`Arrival Ramp Window:   ${RAMP_WINDOW_SEC}s`);
  console.log(`Heartbeats/Candidate:  ${HEARTBEATS_PER_CANDIDATE} (Total: ${MAX_VUS * HEARTBEATS_PER_CANDIDATE})`);
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

  const candidateEmail = generateCandidateEmail(`d2-t3-vu${vuId}`, vuId);
  let failed = false;

  // 1. Candidate Registration
  let signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `Day2 Heartbeat Candidate VU${vuId}`,
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

  // 3. Periodic Telemetry Heartbeats
  let candidateHeartbeatsSaved = 0;
  for (let h = 0; h < HEARTBEATS_PER_CANDIDATE; h++) {
    heartbeatsAttempted.add(1);
    const tHb0 = Date.now();
    let hbRes = postWithRetry(
      `${BASE_URL}/tests/${testInstanceId}/heartbeat`,
      JSON.stringify({
        currentSectionIndex: 0,
        currentQuestionIndex: h,
        answeredCount: h,
        totalQuestions: 60,
        remainingTimeSeconds: 7200 - h * 15,
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
        latencyMs: 120,
      }),
      { headers: authHeaders, tags: { endpoint: "telemetry_heartbeat" }, timeout: "45s" }
    );
    const hbDur = Date.now() - tHb0;
    heartbeatDuration.add(hbDur);
    trackStatus(hbRes, "telemetry_heartbeat");

    const hbOk = check(hbRes, {
      "Heartbeat returns 200": (r) => r.status === 200,
    });

    if (hbOk) {
      heartbeatsSuccess.add(1);
      candidateHeartbeatsSaved++;
    } else {
      heartbeatsDropped.add(1);
      failed = true;
    }

    // Interval between heartbeats
    sleep(1.5);
  }

  totalCandidateDuration.add(Date.now() - vuStart);

  if (!failed && candidateHeartbeatsSaved === HEARTBEATS_PER_CANDIDATE) {
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

  const attempted = getVal("day2_t3_candidates_attempted");
  const success = getVal("day2_t3_candidates_success");
  const failed = getVal("day2_t3_candidates_failed");
  const hbAttempted = getVal("day2_t3_heartbeats_attempted");
  const hbSuccess = getVal("day2_t3_heartbeats_success");
  const hbDropped = getVal("day2_t3_heartbeats_dropped");

  const err429 = getVal("day2_t3_errors_429");
  const err4xx = getVal("day2_t3_errors_4xx");
  const err5xx = getVal("day2_t3_errors_5xx");
  const timeouts = getVal("day2_t3_timeouts");
  const resets = getVal("day2_t3_resets");
  const eof = getVal("day2_t3_eof");
  const errRate = ((data.metrics.day2_t3_error_rate?.values?.rate ?? 0) * 100).toFixed(2);

  const hbLat = getLat("day2_t3_heartbeat_duration_ms");
  const totalLat = getLat("day2_t3_total_duration_ms");

  const report = `
================================================================================
# Qloax Day 2 - Test 3: Heartbeat & Telemetry Report
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
## 2. Heartbeat & Telemetry Operations
- Total Heartbeats Attempted: ${hbAttempted}
- Total Heartbeats Ingested:  ${hbSuccess}
- Total Dropped Heartbeats:   ${hbDropped}
- Ingestion Success Rate:     ${hbAttempted > 0 ? ((hbSuccess / hbAttempted) * 100).toFixed(2) : "0"}%

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Telemetry Heartbeat (/hb)  | ${hbLat.med.padEnd(8)} | ${hbLat.p95.padEnd(8)} | ${hbLat.p99.padEnd(8)} | ${hbLat.max.padEnd(8)} | ${hbLat.avg.padEnd(8)} |
| Total Candidate Flow       | ${totalLat.med.padEnd(8)} | ${totalLat.p95.padEnd(8)} | ${totalLat.p99.padEnd(8)} | ${totalLat.max.padEnd(8)} | ${totalLat.avg.padEnd(8)} |
================================================================================
`;

  return {
    stdout: report,
    "load-tests/reports/day2-test3-heartbeat-telemetry-report.md": report,
  };
}
