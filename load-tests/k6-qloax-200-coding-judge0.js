/**
 * Grafana k6 Load Test: 200 Candidates on Qloax Assessment Coding Questions
 * Verifying Judge0 Remote Sandbox Execution on Deployed AWS/Render Environment
 *
 * Target:
 *  - Deployed API: https://skillitrix.onrender.com/api/v1
 *  - Qloax Assessment Template ID: cmsifafam000099s9csfe33pg
 *  - Referral Code: QLO
 *  - Judge0 Cluster: AWS EC2 (https://15-252-223-20.sslip.io) via API Proxy
 *
 * Candidate Journey:
 *  1. Register unique candidate account (POST /auth/signup) with QLO referral.
 *  2. Start Qloax assessment instance (POST /tests/start).
 *  3. Fetch assessment structure and questions snapshot (GET /tests/:id).
 *  4. Extract the active Coding Question in the assessment.
 *  5. Execute candidate code through Judge0 sandbox (POST /coding/run).
 *  6. Verify Judge0 execution status (HTTP 200, status IDs, memory & runtime telemetry).
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// -----------------------------------------------------------------------------
// Environment Configuration & Options
// -----------------------------------------------------------------------------
export const BASE_URL = (__ENV.BASE_URL || "https://skillitrix.onrender.com/api/v1").replace(/\/+$/, "");
export const APP_URL = (__ENV.APP_URL || "https://app.skillitrix.com").replace(/\/+$/, "");
export const TEST_CONFIG_ID = __ENV.TEST_CONFIG_ID || "cmsifafam000099s9csfe33pg"; // Qloax Assessment
export const REFERRAL_CODE = __ENV.REFERRAL_CODE || "QLO";
export const SIGNUP_PASSWORD = __ENV.SIGNUP_PASSWORD || "LoadTest#2026!";
export const TEST_RUN_ID = __ENV.TEST_RUN_ID || `k6-judge0-200-${Date.now().toString(36)}`;

// Total candidates to simulate and pool concurrency
export const TOTAL_CANDIDATES = Number(__ENV.TOTAL_CANDIDATES) || Number(__ENV.MAX_VUS) || 200;
export const CONCURRENT_VUS = Number(__ENV.CONCURRENT_VUS) || 25; // 25 concurrent VUs to respect rate limits & queue capacity

// -----------------------------------------------------------------------------
// Custom Metrics & Telemetry
// -----------------------------------------------------------------------------
export const metrics = {
  candidatesRegistered: new Counter("candidates_registered"),
  assessmentsStarted: new Counter("assessments_started"),
  questionsFetched: new Counter("questions_fetched"),
  
  // Judge0 Sandbox Metrics
  judge0RunsAttempted: new Counter("judge0_runs_attempted"),
  judge0RunsSuccess: new Counter("judge0_runs_success"),
  judge0RunsFailed: new Counter("judge0_runs_failed"),
  judge0Capacity503: new Counter("judge0_capacity_503"),
  judge0RateLimited429: new Counter("judge0_rate_limited_429"),
  judge0SuccessRate: new Rate("judge0_success_rate"),
  
  // Latency & Execution Performance
  judge0LatencyMs: new Trend("judge0_execution_latency_ms"),
  startTestLatencyMs: new Trend("start_test_latency_ms"),
  signupLatencyMs: new Trend("signup_latency_ms"),
  judge0MemoryKb: new Trend("judge0_memory_kb"),
};

// -----------------------------------------------------------------------------
// Test Scenarios & Configuration
// -----------------------------------------------------------------------------
export const options = {
  scenarios: {
    qloax_coding_evaluation: {
      executor: "shared-iterations",
      vus: CONCURRENT_VUS,
      iterations: TOTAL_CANDIDATES,
      maxDuration: "30m",
    },
  },
  thresholds: {
    judge0_success_rate: ["rate>=0.95"], // At least 95% of Judge0 executions must succeed
    judge0_execution_latency_ms: ["p(95)<10000"], // p95 latency under 10 seconds (including queue wait)
    http_req_failed: ["rate<0.05"], // Overall HTTP failure rate below 5%
  },
};

// Request Headers
function getHeaders(token = null) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    Origin: APP_URL,
    Referer: `${APP_URL}/`,
    "X-Test-Run-Id": TEST_RUN_ID,
    "User-Agent": `k6-qloax-judge0-test/1.0 (VU ${__VU || 1}; Candidate ${__ITER || 0})`,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Execute HTTP POST with exponential backoff for transient 502/503/504 errors
 */
function postWithRetry(url, payload, params, operation, maxRetries = 3) {
  let attempt = 0;
  let res;
  while (attempt < maxRetries) {
    attempt++;
    res = http.post(url, payload, params);
    if (res.status === 200 || res.status === 201 || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
      return res;
    }
    if (attempt < maxRetries) {
      const backoffSec = Math.min(0.5 * Math.pow(2, attempt - 1), 3);
      sleep(backoffSec);
    }
  }
  return res;
}

// -----------------------------------------------------------------------------
// Main Virtual User (VU) Execution Iteration
// -----------------------------------------------------------------------------
export default function () {
  const iterId = __ITER;
  const vuId = __VU;
  const candidateIndex = iterId + 1;

  // Stagger candidate arrivals slightly to avoid initial burst clumping
  if (iterId < CONCURRENT_VUS) {
    sleep((vuId % 10) * 0.3);
  }

  // ---------------------------------------------------------------------------
  // Step 1: Candidate Account Registration (Signup)
  // ---------------------------------------------------------------------------
  const uniqueEmail = `qloax-cand-${candidateIndex}-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}@skillitrix-loadtest.invalid`;
  const signupPayload = JSON.stringify({
    email: uniqueEmail,
    password: SIGNUP_PASSWORD,
    fullName: `Qloax Candidate ${candidateIndex}`,
    referralCode: REFERRAL_CODE,
  });

  const tSign0 = Date.now();
  const signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    signupPayload,
    { headers: getHeaders(), tags: { endpoint: "signup" } },
    "signup",
    3
  );
  metrics.signupLatencyMs.add(Date.now() - tSign0);

  const signupOk = check(signupRes, {
    "Candidate signup 200/201": (r) => r.status === 200 || r.status === 201,
    "Access token received": (r) => Boolean(r.json("data.accessToken") || r.json("accessToken")),
  });

  if (!signupOk) {
    console.error(`[Candidate ${candidateIndex}] Signup failed: ${signupRes.status} ${signupRes.body?.slice(0, 150)}`);
    return;
  }

  const accessToken = signupRes.json("data.accessToken") || signupRes.json("accessToken");
  metrics.candidatesRegistered.add(1);
  const authHeaders = getHeaders(accessToken);

  // ---------------------------------------------------------------------------
  // Step 2: Start Qloax Assessment
  // ---------------------------------------------------------------------------
  sleep(0.5);
  const startPayload = JSON.stringify({ testConfigId: TEST_CONFIG_ID });
  const tStart0 = Date.now();
  const startRes = postWithRetry(
    `${BASE_URL}/tests/start`,
    startPayload,
    { headers: authHeaders, tags: { endpoint: "start_test" }, timeout: "60s" },
    "start_test",
    3
  );
  metrics.startTestLatencyMs.add(Date.now() - tStart0);

  const startOk = check(startRes, {
    "Start assessment 200": (r) => r.status === 200,
    "Test instance ID returned": (r) => Boolean(r.json("data.testInstanceId")),
  });

  if (!startOk) {
    console.error(`[Candidate ${candidateIndex}] Start assessment failed: ${startRes.status} ${startRes.body?.slice(0, 150)}`);
    return;
  }

  const testInstanceId = startRes.json("data.testInstanceId");
  metrics.assessmentsStarted.add(1);

  // ---------------------------------------------------------------------------
  // Step 3: Fetch Assessment Snapshot & Identify Coding Question
  // ---------------------------------------------------------------------------
  sleep(0.3);
  const getRes = http.get(`${BASE_URL}/tests/${testInstanceId}`, {
    headers: authHeaders,
    tags: { endpoint: "get_test" },
    timeout: "30s",
  });

  const getOk = check(getRes, {
    "Get assessment snapshot 200": (r) => r.status === 200,
  });

  if (!getOk) {
    console.error(`[Candidate ${candidateIndex}] Failed to fetch assessment: ${getRes.status}`);
    return;
  }

  const instData = getRes.json("data");
  let codingQuestionId = null;

  // Search across sections for the coding question
  if (instData && instData.sections && Array.isArray(instData.sections)) {
    for (let s = 0; s < instData.sections.length; s++) {
      const sec = instData.sections[s];
      if (sec.questions && Array.isArray(sec.questions)) {
        for (let q = 0; q < sec.questions.length; q++) {
          const item = sec.questions[q];
          const snap = item.snapshot || item;
          if (snap.questionType === "CODING" || snap.type === "CODING" || (snap.codingData && snap.codingData.patternId)) {
            codingQuestionId = item.questionId || snap.id;
            break;
          }
        }
      }
      if (codingQuestionId) break;
    }
  }

  // Fallback to Section 5 Question 1 if snapshot format is nested
  if (!codingQuestionId && instData && instData.sections && instData.sections.length >= 5) {
    const sec5 = instData.sections[4];
    if (sec5.questions && sec5.questions.length > 0) {
      codingQuestionId = sec5.questions[0].questionId;
    }
  }

  if (!codingQuestionId) {
    console.error(`[Candidate ${candidateIndex}] No coding question located in assessment instance ${testInstanceId}`);
    return;
  }
  metrics.questionsFetched.add(1);

  // ---------------------------------------------------------------------------
  // Step 4: Execute Candidate Code via Judge0 Sandbox (POST /api/v1/coding/run)
  // ---------------------------------------------------------------------------
  sleep(0.5);
  metrics.judge0RunsAttempted.add(1);

  // Candidate solution to execute against Judge0
  // Multi-language rotation: 80% Python, 20% Java
  const isPython = (candidateIndex % 5) !== 0;
  const language = isPython ? "python" : "java";
  
  const pythonCode = `def solution(*args, **kwargs):\n    # Candidate ${candidateIndex} submission for Qloax assessment\n    return True\n`;
  const javaCode = `public class Solution {\n    public boolean solution(int a, int b) {\n        return (a + b) > 0;\n    }\n}`;

  const runPayload = JSON.stringify({
    questionId: codingQuestionId,
    testInstanceId: testInstanceId,
    code: isPython ? pythonCode : javaCode,
    language: language,
  });

  const tJudge0 = Date.now();
  const runRes = http.post(`${BASE_URL}/coding/run`, runPayload, {
    headers: authHeaders,
    tags: { endpoint: "coding_run" },
    timeout: "60s", // API enforces 45s run timeout
  });
  const execDuration = Date.now() - tJudge0;
  metrics.judge0LatencyMs.add(execDuration);

  // Track response codes
  if (runRes.status === 503) {
    metrics.judge0Capacity503.add(1);
    console.warn(`[Candidate ${candidateIndex}] Judge0 queue at capacity (503 Service Unavailable)`);
  } else if (runRes.status === 429) {
    metrics.judge0RateLimited429.add(1);
    console.warn(`[Candidate ${candidateIndex}] Rate limited (429 Too Many Requests)`);
  }

  // Validate Judge0 Execution Contract
  const runOk = check(runRes, {
    "Judge0 Run HTTP 200 OK": (r) => r.status === 200,
    "Judge0 Execution success flag": (r) => r.json("success") === true,
    "Judge0 Public test results returned": (r) => Array.isArray(r.json("results")) && r.json("results").length > 0,
    "Judge0 Sandbox execution completed": (r) => {
      const results = r.json("results");
      return Array.isArray(results) && results[0] && results[0].status !== undefined;
    },
  });

  if (runOk) {
    metrics.judge0RunsSuccess.add(1);
    metrics.judge0SuccessRate.add(1);
    const results = runRes.json("results");
    if (results && results[0] && results[0].memoryKb) {
      metrics.judge0MemoryKb.add(results[0].memoryKb);
    }
  } else {
    metrics.judge0RunsFailed.add(1);
    metrics.judge0SuccessRate.add(0);
    console.error(
      `[Candidate ${candidateIndex}] Judge0 Run FAILED (${runRes.status}): ${runRes.body ? runRes.body.slice(0, 200) : "empty"}`
    );
  }

  // Brief pause before VU ends iteration
  sleep(0.5);
}

// -----------------------------------------------------------------------------
// Custom Summary & Reporting
// -----------------------------------------------------------------------------
export function handleSummary(data) {
  const getVal = (name) => (data.metrics[name] ? data.metrics[name].values.count || 0 : 0);
  const getRate = (name) => (data.metrics[name] ? (data.metrics[name].values.rate * 100).toFixed(2) : "0.00");
  const getLatency = (name) => {
    if (!data.metrics[name] || !data.metrics[name].values) {
      return { avg: "N/A", p90: "N/A", p95: "N/A", max: "N/A" };
    }
    const v = data.metrics[name].values;
    return {
      avg: `${Math.round(v.avg || 0)}ms`,
      p90: `${Math.round(v["p(90)"] || 0)}ms`,
      p95: `${Math.round(v["p(95)"] || 0)}ms`,
      max: `${Math.round(v.max || 0)}ms`,
    };
  };

  const registered = getVal("candidates_registered");
  const started = getVal("assessments_started");
  const judge0Attempts = getVal("judge0_runs_attempted");
  const judge0Success = getVal("judge0_runs_success");
  const judge0Failed = getVal("judge0_runs_failed");
  const judge0503 = getVal("judge0_capacity_503");
  const judge0RateLimit = getVal("judge0_rate_limited_429");
  const successRate = getRate("judge0_success_rate");
  const judge0Lat = getLatency("judge0_execution_latency_ms");
  const startLat = getLatency("start_test_latency_ms");

  const isJudge0Working = Number(successRate) >= 90.0 && judge0Success > 0;

  const summaryText = `
================================================================================
          QLOAX ASSESSMENT — 200 CANDIDATE JUDGE0 LOAD TEST REPORT
================================================================================
Target Environment:      ${BASE_URL}
Assessment ID:           ${TEST_CONFIG_ID}
Total Candidates Target: ${TOTAL_CANDIDATES}
Concurrent Workers (VU): ${CONCURRENT_VUS}
Test Run ID:             ${TEST_RUN_ID}

--------------------------------------------------------------------------------
1. CANDIDATE LIFECYCLE SUMMARY
--------------------------------------------------------------------------------
- Candidates Registered:    ${registered} / ${TOTAL_CANDIDATES}
- Assessment Instances:     ${started} / ${TOTAL_CANDIDATES}
- Start Test Latency (p95): ${startLat.p95} (Avg: ${startLat.avg})

--------------------------------------------------------------------------------
2. JUDGE0 REMOTE SANDBOX VERIFICATION
--------------------------------------------------------------------------------
- Judge0 Runs Attempted:    ${judge0Attempts}
- Judge0 Runs Succeeded:    ${judge0Success}
- Judge0 Runs Failed:       ${judge0Failed}
- Capacity Limits (503):    ${judge0503}
- Rate Limited (429):       ${judge0RateLimit}
- Judge0 Success Rate:      ${successRate}%

--------------------------------------------------------------------------------
3. JUDGE0 LATENCY & PERFORMANCE BREAKDOWN
--------------------------------------------------------------------------------
- Average Latency:          ${judge0Lat.avg}
- 90th Percentile (p90):    ${judge0Lat.p90}
- 95th Percentile (p95):    ${judge0Lat.p95}
- Max Latency Recorded:     ${judge0Lat.max}

--------------------------------------------------------------------------------
4. VERDICT & HEALTH STATUS
--------------------------------------------------------------------------------
Judge0 Operational Status:  ${isJudge0Working ? "✅ PASS — JUDGE0 IS WORKING NORMALLY ON AWS" : "❌ FAIL — JUDGE0 EXPERIENCED FAILURES"}
================================================================================
`;

  return {
    stdout: summaryText,
    "load-tests/reports/qloax-200-candidates-judge0-report.json": JSON.stringify(data, null, 2),
  };
}
