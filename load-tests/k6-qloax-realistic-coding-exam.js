/**
 * Grafana k6 Load Test: Realistic Candidate Coding Exam Profile
 *
 * Exam Workflow per Candidate:
 *  - Both Coding Questions in Qloax Assessment (Section 5)
 *  - Question 1: Candidate iterates, runs code 4–5 times (POST /coding/run), then submits (POST /coding/submit)
 *  - Question 2: Candidate iterates, runs code 4–5 times (POST /coding/run), then submits (POST /coding/submit)
 *  - Total Judge0 executions per candidate: 10–12 executions (8–10 Runs + 2 Submits)
 *
 * Sizing across 200 candidates:
 *  - ~1,600 to 2,000 Run executions
 *  - ~400 Full Submit executions
 *  - ~2,000 to 2,400 Total Judge0 calls
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

export const BASE_URL = (__ENV.BASE_URL || "https://skillitrix.onrender.com/api/v1").replace(/\/+$/, "");
export const APP_URL = (__ENV.APP_URL || "https://app.skillitrix.com").replace(/\/+$/, "");
export const TEST_CONFIG_ID = __ENV.TEST_CONFIG_ID || "cmsifafam000099s9csfe33pg";
export const REFERRAL_CODE = __ENV.REFERRAL_CODE || "QLO";
export const SIGNUP_PASSWORD = __ENV.SIGNUP_PASSWORD || "LoadTest#2026!";
export const TEST_RUN_ID = __ENV.TEST_RUN_ID || `k6-real-exam-${Date.now().toString(36)}`;

export const TOTAL_CANDIDATES = Number(__ENV.TOTAL_CANDIDATES) || Number(__ENV.MAX_VUS) || 10;
export const CONCURRENT_VUS = Number(__ENV.CONCURRENT_VUS) || 5;
export const RUNS_PER_QUESTION = Number(__ENV.RUNS_PER_QUESTION) || 4; // 4 to 5 runs per question

// Custom Metrics
export const metrics = {
  candidatesRegistered: new Counter("candidates_registered"),
  assessmentsStarted: new Counter("assessments_started"),
  q1RunsExecuted: new Counter("q1_runs_executed"),
  q1SubmitsExecuted: new Counter("q1_submits_executed"),
  q2RunsExecuted: new Counter("q2_runs_executed"),
  q2SubmitsExecuted: new Counter("q2_submits_executed"),
  totalJudge0Calls: new Counter("total_judge0_executions"),
  judge0SuccessRate: new Rate("judge0_success_rate"),
  runLatencyMs: new Trend("judge0_run_latency_ms"),
  submitLatencyMs: new Trend("judge0_submit_latency_ms"),
};

export const options = {
  scenarios: {
    realistic_coding_exam: {
      executor: "shared-iterations",
      vus: CONCURRENT_VUS,
      iterations: TOTAL_CANDIDATES,
      maxDuration: "30m",
    },
  },
  thresholds: {
    judge0_success_rate: ["rate>=0.95"],
    "judge0_run_latency_ms": ["p(95)<15000"],
    "judge0_submit_latency_ms": ["p(95)<25000"],
  },
};

function getHeaders(token = null) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    Origin: APP_URL,
    Referer: `${APP_URL}/`,
    "X-Test-Run-Id": TEST_RUN_ID,
    "User-Agent": `k6-qloax-real-exam/1.0 (VU ${__VU}; Iter ${__ITER})`,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function postWithRetry(url, payload, params, operation, maxRetries = 3) {
  let attempt = 0;
  let res;
  while (attempt < maxRetries) {
    attempt++;
    res = http.post(url, payload, params);
    if (res.status === 200 || res.status === 201 || (res.status >= 400 && res.status < 500 && res.status !== 429)) {
      return res;
    }
    if (attempt < maxRetries) sleep(Math.min(0.5 * Math.pow(2, attempt - 1), 3));
  }
  return res;
}

export default function () {
  const candidateIndex = __ITER + 1;

  // 1. Signup
  const email = `qloax-realcand-${candidateIndex}-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}@skillitrix-loadtest.invalid`;
  const signupRes = postWithRetry(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email,
      password: SIGNUP_PASSWORD,
      fullName: `Candidate ${candidateIndex}`,
      referralCode: REFERRAL_CODE,
    }),
    { headers: getHeaders(), tags: { endpoint: "signup" } },
    "signup"
  );

  const token = signupRes.json("data.accessToken") || signupRes.json("accessToken");
  if (!token) return;
  metrics.candidatesRegistered.add(1);
  const authHeaders = getHeaders(token);

  // 2. Start Assessment
  sleep(0.5);
  const startRes = postWithRetry(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: TEST_CONFIG_ID }),
    { headers: authHeaders, tags: { endpoint: "start_test" } },
    "start_test"
  );

  const testInstanceId = startRes.json("data.testInstanceId");
  if (!testInstanceId) return;
  metrics.assessmentsStarted.add(1);

  // 3. Fetch Assessment Questions (Find Both Coding Questions in Section 5)
  sleep(0.3);
  const getRes = http.get(`${BASE_URL}/tests/${testInstanceId}`, { headers: authHeaders });
  if (getRes.status !== 200) return;

  const instData = getRes.json("data");
  let codingQuestions = [];
  if (instData?.sections) {
    for (const s of instData.sections) {
      if (s.questions) {
        for (const q of s.questions) {
          const snap = q.snapshot || q;
          if (snap.questionType === "CODING" || snap.type === "CODING" || snap.codingData) {
            codingQuestions.push(q.questionId || snap.id);
          }
        }
      }
    }
  }

  // Fallback to Section 5 if metadata nested
  if (codingQuestions.length === 0 && instData?.sections?.[4]?.questions) {
    codingQuestions = instData.sections[4].questions.map((q) => q.questionId);
  }

  const q1Id = codingQuestions[0];
  const q2Id = codingQuestions[1] || codingQuestions[0];

  // ---------------------------------------------------------------------------
  // QUESTION 1: 4 to 5 Runs + 1 Final Submit
  // ---------------------------------------------------------------------------
  if (q1Id) {
    for (let r = 1; r <= RUNS_PER_QUESTION; r++) {
      sleep(0.8); // Candidate typing/thinking delay between runs
      const t0 = Date.now();
      const runRes = http.post(
        `${BASE_URL}/coding/run`,
        JSON.stringify({
          questionId: q1Id,
          testInstanceId,
          code: `def solution(*args):\n    # Iteration ${r} for Q1 by Cand ${candidateIndex}\n    return True\n`,
          language: "python",
        }),
        { headers: authHeaders, tags: { endpoint: "coding_run" }, timeout: "60s" }
      );
      metrics.runLatencyMs.add(Date.now() - t0);
      metrics.totalJudge0Calls.add(1);
      metrics.q1RunsExecuted.add(1);

      const ok = runRes.status === 200 && runRes.json("success") === true;
      metrics.judge0SuccessRate.add(ok ? 1 : 0);
    }

    // Question 1 Submit
    sleep(1.0);
    const tSub0 = Date.now();
    const subRes = http.post(
      `${BASE_URL}/coding/submit`,
      JSON.stringify({
        questionId: q1Id,
        testInstanceId,
        code: `def solution(*args):\n    # Final submission for Q1 by Cand ${candidateIndex}\n    return True\n`,
        language: "python",
      }),
      { headers: authHeaders, tags: { endpoint: "coding_submit" }, timeout: "120s" }
    );
    metrics.submitLatencyMs.add(Date.now() - tSub0);
    metrics.totalJudge0Calls.add(1);
    metrics.q1SubmitsExecuted.add(1);

    const subOk = subRes.status === 200 && subRes.json("success") === true;
    metrics.judge0SuccessRate.add(subOk ? 1 : 0);
  }

  // ---------------------------------------------------------------------------
  // QUESTION 2: 4 to 5 Runs + 1 Final Submit
  // ---------------------------------------------------------------------------
  if (q2Id) {
    for (let r = 1; r <= RUNS_PER_QUESTION; r++) {
      sleep(0.8);
      const t0 = Date.now();
      const runRes = http.post(
        `${BASE_URL}/coding/run`,
        JSON.stringify({
          questionId: q2Id,
          testInstanceId,
          code: `def solution(*args):\n    # Iteration ${r} for Q2 by Cand ${candidateIndex}\n    return True\n`,
          language: "python",
        }),
        { headers: authHeaders, tags: { endpoint: "coding_run" }, timeout: "60s" }
      );
      metrics.runLatencyMs.add(Date.now() - t0);
      metrics.totalJudge0Calls.add(1);
      metrics.q2RunsExecuted.add(1);

      const ok = runRes.status === 200 && runRes.json("success") === true;
      metrics.judge0SuccessRate.add(ok ? 1 : 0);
    }

    // Question 2 Submit
    sleep(1.0);
    const tSub0 = Date.now();
    const subRes = http.post(
      `${BASE_URL}/coding/submit`,
      JSON.stringify({
        questionId: q2Id,
        testInstanceId,
        code: `def solution(*args):\n    # Final submission for Q2 by Cand ${candidateIndex}\n    return True\n`,
        language: "python",
      }),
      { headers: authHeaders, tags: { endpoint: "coding_submit" }, timeout: "120s" }
    );
    metrics.submitLatencyMs.add(Date.now() - tSub0);
    metrics.totalJudge0Calls.add(1);
    metrics.q2SubmitsExecuted.add(1);

    const subOk = subRes.status === 200 && subRes.json("success") === true;
    metrics.judge0SuccessRate.add(subOk ? 1 : 0);
  }

  sleep(0.5);
}

export function handleSummary(data) {
  const getVal = (name) => (data.metrics[name] ? data.metrics[name].values.count || 0 : 0);
  const getRate = (name) => (data.metrics[name] ? (data.metrics[name].values.rate * 100).toFixed(2) : "0.00");
  const getLatency = (name) => {
    if (!data.metrics[name]?.values) return { avg: "N/A", p95: "N/A" };
    const v = data.metrics[name].values;
    return {
      avg: `${Math.round(v.avg || 0)}ms`,
      p95: `${Math.round(v["p(95)"] || 0)}ms`,
    };
  };

  const cands = getVal("candidates_registered");
  const q1Runs = getVal("q1_runs_executed");
  const q1Subs = getVal("q1_submits_executed");
  const q2Runs = getVal("q2_runs_executed");
  const q2Subs = getVal("q2_submits_executed");
  const totalJudge = getVal("total_judge0_executions");
  const rate = getRate("judge0_success_rate");
  const runLat = getLatency("judge0_run_latency_ms");
  const subLat = getLatency("judge0_submit_latency_ms");

  const text = `
================================================================================
     REALISTIC CANDIDATE EXAM PROFILE — 2 CODING QUESTIONS JUDGE0 REPORT
================================================================================
Candidates Completed:          ${cands}
Question 1 Public Runs:        ${q1Runs}
Question 1 Full Submissions:   ${q1Subs}
Question 2 Public Runs:        ${q2Runs}
Question 2 Full Submissions:   ${q2Subs}
--------------------------------------------------------------------------------
TOTAL JUDGE0 EXECUTIONS:       ${totalJudge}
Judge0 Success Rate:           ${rate}%
Judge0 Run Latency (p95):      ${runLat.p95} (Avg: ${runLat.avg})
Judge0 Submit Latency (p95):   ${subLat.p95} (Avg: ${subLat.avg})
Verdict:                       ${Number(rate) >= 95 ? "✅ PASS — PRODUCTION READY" : "❌ FAIL"}
================================================================================
`;
  return { stdout: text };
}
