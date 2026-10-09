/**
 * Grafana k6 Load Test: 200 TRULY CONCURRENT Coding Candidates
 *
 * Unlike the earlier coding scripts (shared-iterations with a 12–25 VU pool),
 * every candidate here is its own VU and all 200 are inside the exam at once.
 *
 * Phases:
 *  1. Setup (spread over SETUP_WINDOW_S): signup -> POST /tests/start -> GET /tests/:id.
 *     Start-test is a known DB bottleneck and is deliberately NOT what this test measures.
 *  2. Waiting room: heartbeat every 15s until the shared burst instant.
 *  3. Burst: all candidates hit POST /coding/run at the same moment.
 *  4. Sustained coding: per question, RUNS_PER_QUESTION(+0/1) runs + 1 submit,
 *     with THINK_MIN_S–THINK_MAX_S human think time; then finish the assessment.
 *
 * A health-probe VU polls /health every 5s, records API process restarts (via the
 * reported uptime) and aborts the whole test if the API is down for 60s straight.
 *
 * Run from the repo root (report paths are relative):
 *   k6 run load-tests/k6-qloax-200-concurrent-coding.js
 */

import http from "k6/http";
import { sleep } from "k6";
import exec from "k6/execution";
import { Counter, Rate, Trend } from "k6/metrics";

const BASE_URL = (__ENV.BASE_URL || "https://skillitrix.onrender.com/api/v1").replace(/\/+$/, "");
const APP_URL = (__ENV.APP_URL || "https://app.skillitrix.com").replace(/\/+$/, "");
const TEST_CONFIG_ID = __ENV.TEST_CONFIG_ID || "cmsifafam000099s9csfe33pg";
const REFERRAL_CODE = __ENV.REFERRAL_CODE || "QLO";
const SIGNUP_PASSWORD = __ENV.SIGNUP_PASSWORD || "LoadTest#2026!";
const TEST_RUN_ID = __ENV.TEST_RUN_ID || `k6-cc200-${Date.now().toString(36)}`;

const CANDIDATES = Number(__ENV.CANDIDATES) || 200;
const SETUP_WINDOW_S = Number(__ENV.SETUP_WINDOW_S) || 300;
const BURST_BUFFER_S = Number(__ENV.BURST_BUFFER_S) || 120;
const RUNS_PER_QUESTION = Number(__ENV.RUNS_PER_QUESTION) || 4;
const THINK_MIN_S = Number(__ENV.THINK_MIN_S) || 15;
const THINK_MAX_S = Number(__ENV.THINK_MAX_S) || 45;
const JAVA_SHARE = __ENV.JAVA_SHARE !== undefined ? Number(__ENV.JAVA_SHARE) : 0.2;
const PROBE_AFTER_BURST_S = Number(__ENV.PROBE_AFTER_BURST_S) || 720;
const PROBE_INTERVAL_S = 5;
const DOWN_ABORT_S = 60;
const CANDIDATE_PATIENCE_MS = 45000; // a run slower than this is a failed experience
const REPORT_BASENAME = "load-tests/reports/qloax-200-concurrent-coding-report";

const m = {
  registered: new Counter("cc_candidates_registered"),
  started: new Counter("cc_assessments_started"),
  readyForBurst: new Counter("cc_ready_for_burst"),
  lateForBurst: new Counter("cc_late_for_burst"),
  finished: new Counter("cc_assessments_finished"),
  runs: new Counter("cc_code_runs"),
  submits: new Counter("cc_code_submits"),
  heartbeats: new Counter("cc_heartbeats"),

  status2xx: new Counter("cc_http_2xx"),
  status4xx: new Counter("cc_http_4xx"),
  status429: new Counter("cc_http_429"),
  status502: new Counter("cc_http_502"),
  status503: new Counter("cc_http_503"),
  status5xx: new Counter("cc_http_5xx_total"),
  status0: new Counter("cc_conn_failures_or_timeouts"),
  tooSlow: new Counter("cc_runs_over_45s"),

  burstRunMs: new Trend("cc_burst_run_latency_ms", true),
  runMs: new Trend("cc_run_latency_ms", true),
  submitMs: new Trend("cc_submit_latency_ms", true),
  startMs: new Trend("cc_start_latency_ms", true),
  heartbeatMs: new Trend("cc_heartbeat_latency_ms", true),
  finishMs: new Trend("cc_finish_latency_ms", true),
  healthMs: new Trend("cc_health_latency_ms", true),

  codeOk: new Rate("cc_code_execution_success"),
  burstOk: new Rate("cc_burst_run_success"),
  completion: new Rate("cc_candidate_completion"),
  healthUp: new Rate("cc_health_up"),
  restarts: new Counter("cc_api_process_restarts"),
};

export const options = {
  setupTimeout: "60s",
  scenarios: {
    candidates: {
      executor: "per-vu-iterations",
      exec: "candidate",
      vus: CANDIDATES,
      iterations: 1,
      maxDuration: "45m",
    },
    health_probe: {
      executor: "per-vu-iterations",
      exec: "healthProbe",
      vus: 1,
      iterations: 1,
      maxDuration: "45m",
    },
  },
  thresholds: {
    cc_code_execution_success: ["rate>=0.95"],
    cc_burst_run_success: ["rate>=0.95"],
    cc_run_latency_ms: ["p(95)<15000"],
    cc_candidate_completion: ["rate>=0.90"],
    cc_api_process_restarts: ["count==0"],
  },
  summaryTrendStats: ["avg", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  const now = Date.now();
  return { testStartMs: now, burstAtMs: now + (SETUP_WINDOW_S + BURST_BUFFER_S) * 1000 };
}

function headers(token) {
  const h = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    Origin: APP_URL,
    Referer: `${APP_URL}/`,
    "X-Test-Run-Id": TEST_RUN_ID,
    "User-Agent": `k6-cc200/1.0 (VU ${__VU})`,
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function classify(res) {
  const s = res ? res.status : 0;
  if (s === 0) m.status0.add(1);
  else if (s >= 200 && s < 300) m.status2xx.add(1);
  else if (s === 429) m.status429.add(1);
  else if (s >= 400 && s < 500) m.status4xx.add(1);
  if (s >= 500) {
    m.status5xx.add(1);
    if (s === 502) m.status502.add(1);
    if (s === 503) m.status503.add(1);
  }
}

function json(res, path) {
  try {
    return res && res.body ? res.json(path) : null;
  } catch (_) {
    return null;
  }
}

function post(url, body, token, tag, timeout = "60s") {
  const res = http.post(url, body === null ? null : JSON.stringify(body), {
    headers: headers(token),
    tags: { endpoint: tag },
    timeout,
  });
  classify(res);
  return res;
}

function think() {
  sleep(THINK_MIN_S + Math.random() * (THINK_MAX_S - THINK_MIN_S));
}

function codeFor(language, questionNum, iteration, isFinal) {
  if (language === "java") {
    return `class Solution {
    public int[] solve(int[][] matrix) {
        // Q${questionNum} ${isFinal ? "final" : `run ${iteration}`}
        int[] out = new int[matrix.length];
        for (int i = 0; i < matrix.length; i++) {
            int s = 0;
            for (int v : matrix[i]) s += v;
            out[i] = s;
        }
        return out;
    }
}`;
  }
  return `def solution(matrix):
    # Q${questionNum} ${isFinal ? "final" : `run ${iteration}`}
    row_sums = [sum(r) for r in matrix]
    col_sums = [sum(c) for c in zip(*matrix)] if matrix else []
    return {"rowSums": row_sums, "colSums": col_sums}
`;
}

function executeCode(kind, token, testInstanceId, questionId, language, questionNum, iteration, isBurst) {
  const isSubmit = kind === "submit";
  const t0 = Date.now();
  const res = post(
    `${BASE_URL}/coding/${isSubmit ? "submit" : "run"}`,
    { questionId, testInstanceId, code: codeFor(language, questionNum, iteration, isSubmit), language },
    token,
    isSubmit ? "coding_submit" : isBurst ? "coding_run_burst" : "coding_run",
    "120s",
  );
  const dur = Date.now() - t0;
  const ok =
    res.status === 200 && (json(res, "success") === true || json(res, "data.success") === true);

  if (isSubmit) {
    m.submits.add(1);
    m.submitMs.add(dur);
  } else {
    m.runs.add(1);
    m.runMs.add(dur);
    if (dur > CANDIDATE_PATIENCE_MS) m.tooSlow.add(1);
  }
  if (isBurst) {
    m.burstRunMs.add(dur);
    m.burstOk.add(ok ? 1 : 0);
  }
  m.codeOk.add(ok ? 1 : 0);
  return ok;
}

function findCodingQuestions(manifest) {
  const ids = [];
  for (const s of (manifest && manifest.sections) || []) {
    for (const q of s.questions || []) {
      const snap = q.snapshot || q;
      if (snap.questionType === "CODING" || snap.type === "CODING" || snap.codingData) {
        ids.push(q.questionId || snap.id);
      }
    }
  }
  if (ids.length === 0 && manifest?.sections?.[4]?.questions) {
    for (const q of manifest.sections[4].questions) ids.push(q.questionId || q.id);
  }
  return ids;
}

export function candidate(data) {
  const idx = exec.scenario.iterationInTest; // 0..CANDIDATES-1
  const language = Math.random() < JAVA_SHARE ? "java" : "python";

  // 1. Setup, spread evenly across the setup window
  sleep((idx * SETUP_WINDOW_S) / CANDIDATES);

  const email = `cc200-${idx + 1}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}@skillitrix-loadtest.invalid`;
  const signup = post(
    `${BASE_URL}/auth/signup`,
    { email, password: SIGNUP_PASSWORD, fullName: `CC200 Candidate ${idx + 1}`, referralCode: REFERRAL_CODE },
    null,
    "signup",
  );
  const token = json(signup, "data.accessToken") || json(signup, "accessToken");
  if (!token) {
    m.completion.add(0);
    return;
  }
  m.registered.add(1);

  sleep(1);
  const tStart = Date.now();
  const start = post(`${BASE_URL}/tests/start`, { testConfigId: TEST_CONFIG_ID }, token, "start_test", "90s");
  m.startMs.add(Date.now() - tStart);
  const testInstanceId = json(start, "data.testInstanceId");
  if (!testInstanceId) {
    m.completion.add(0);
    return;
  }
  m.started.add(1);

  const manifestRes = http.get(`${BASE_URL}/tests/${testInstanceId}`, {
    headers: headers(token),
    tags: { endpoint: "get_test_manifest" },
    timeout: "60s",
  });
  classify(manifestRes);
  const codingIds = findCodingQuestions(json(manifestRes, "data"));
  if (manifestRes.status !== 200 || codingIds.length === 0) {
    m.completion.add(0);
    return;
  }
  const questions = [codingIds[0], codingIds[1] || codingIds[0]];

  // 2. Waiting room: heartbeat every 15s until the shared burst instant
  if (Date.now() >= data.burstAtMs) {
    m.lateForBurst.add(1);
  } else {
    m.readyForBurst.add(1);
    while (data.burstAtMs - Date.now() > 15000) {
      const tHb = Date.now();
      post(
        `${BASE_URL}/tests/${testInstanceId}/heartbeat`,
        { currentSectionIndex: 4, answeredCount: 0, networkStatus: "ONLINE", autosaveHealth: "HEALTHY", clientTimestamp: new Date().toISOString() },
        token,
        "heartbeat",
        "30s",
      );
      m.heartbeatMs.add(Date.now() - tHb);
      m.heartbeats.add(1);
      sleep(15);
    }
    const remaining = data.burstAtMs - Date.now();
    if (remaining > 0) sleep(remaining / 1000);
  }

  // 3 + 4. Burst on the first run, then sustained runs/submits with think time
  let first = true;
  for (let q = 0; q < questions.length; q++) {
    const runs = RUNS_PER_QUESTION + (Math.random() > 0.5 ? 1 : 0);
    for (let r = 1; r <= runs; r++) {
      if (!first) think();
      executeCode("run", token, testInstanceId, questions[q], language, q + 1, r, first);
      first = false;
    }
    think();
    executeCode("submit", token, testInstanceId, questions[q], language, q + 1, runs, false);
  }

  sleep(2);
  const tFin = Date.now();
  const fin = post(`${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`, null, token, "finish_assessment");
  m.finishMs.add(Date.now() - tFin);
  const finOk = fin.status === 200 && (json(fin, "success") === true || json(fin, "data.success") === true);
  if (finOk) m.finished.add(1);
  m.completion.add(finOk ? 1 : 0);
}

export function healthProbe(data) {
  const stopAt = data.burstAtMs + PROBE_AFTER_BURST_S * 1000;
  const seenProcessStarts = new Set();
  let downSinceMs = null;
  let wasUp = true;

  while (Date.now() < stopAt) {
    const t0 = Date.now();
    const res = http.get(`${BASE_URL}/health`, { tags: { endpoint: "health_probe" }, timeout: "10s" });
    const up = res.status === 200;
    m.healthMs.add(Date.now() - t0);
    m.healthUp.add(up ? 1 : 0);

    if (up) {
      const uptime = json(res, "data.uptime");
      if (typeof uptime === "number") {
        // Bucket the process start time to 30s to tolerate clock jitter between probes
        const startBucket = Math.round((Date.now() / 1000 - uptime) / 30);
        if (!seenProcessStarts.has(startBucket)) {
          seenProcessStarts.add(startBucket);
          if (startBucket * 30 * 1000 > data.testStartMs) {
            m.restarts.add(1);
            console.warn(`[probe] API process (re)started during test — uptime ${Math.round(uptime)}s at ${new Date().toISOString()}`);
          }
        }
      }
      if (!wasUp) console.warn(`[probe] API back UP at ${new Date().toISOString()}`);
      downSinceMs = null;
      wasUp = true;
    } else {
      if (wasUp) console.warn(`[probe] API DOWN (status ${res.status}) at ${new Date().toISOString()}`);
      wasUp = false;
      downSinceMs = downSinceMs || Date.now();
      if (Date.now() - downSinceMs >= DOWN_ABORT_S * 1000) {
        exec.test.abort(`API /health failing for ${DOWN_ABORT_S}s — aborting to stop hammering production`);
      }
    }
    sleep(PROBE_INTERVAL_S);
  }
}

export function handleSummary(data) {
  const count = (n) => (data.metrics[n] ? data.metrics[n].values.count || 0 : 0);
  const rate = (n) => (data.metrics[n] ? (data.metrics[n].values.rate * 100).toFixed(2) : "n/a");
  const lat = (n) => {
    const v = data.metrics[n] && data.metrics[n].values;
    if (!v) return "n/a";
    const f = (x) => `${Math.round(x || 0)}ms`;
    return `avg=${f(v.avg)} p50=${f(v.med)} p90=${f(v["p(90)"])} p95=${f(v["p(95)"])} p99=${f(v["p(99)"])} max=${f(v.max)}`;
  };
  const durS = data.state && data.state.testRunDurationMs ? (data.state.testRunDurationMs / 1000).toFixed(0) : "n/a";
  const totalReqs = data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0;

  const text = `
================================================================================
  k6 REPORT — ${CANDIDATES} CONCURRENT CODING CANDIDATES (run ${TEST_RUN_ID})
================================================================================
Target API:                ${BASE_URL}
Assessment:                ${TEST_CONFIG_ID}
Duration:                  ${durS}s   HTTP requests: ${totalReqs}
Language mix:              ${Math.round(JAVA_SHARE * 100)}% Java / ${Math.round((1 - JAVA_SHARE) * 100)}% Python
--------------------------------------------------------------------------------
CANDIDATES
  Registered:              ${count("cc_candidates_registered")} / ${CANDIDATES}
  Started assessment:      ${count("cc_assessments_started")} / ${CANDIDATES}
  In waiting room at burst:${count("cc_ready_for_burst")}  (late: ${count("cc_late_for_burst")})
  Finished assessment:     ${count("cc_assessments_finished")}  (completion ${rate("cc_candidate_completion")}%)
--------------------------------------------------------------------------------
CODE EXECUTION
  Runs / Submits:          ${count("cc_code_runs")} / ${count("cc_code_submits")}
  Success rate (all):      ${rate("cc_code_execution_success")}%
  Success rate (burst):    ${rate("cc_burst_run_success")}%
  Runs slower than 45s:    ${count("cc_runs_over_45s")}
--------------------------------------------------------------------------------
LATENCY
  Burst run (all at once): ${lat("cc_burst_run_latency_ms")}
  Run (all):               ${lat("cc_run_latency_ms")}
  Submit:                  ${lat("cc_submit_latency_ms")}
  Start test:              ${lat("cc_start_latency_ms")}
  Heartbeat:               ${lat("cc_heartbeat_latency_ms")}
  Finish assessment:       ${lat("cc_finish_latency_ms")}
  /health probe:           ${lat("cc_health_latency_ms")}
--------------------------------------------------------------------------------
ERRORS & STABILITY
  2xx / 4xx / 429:         ${count("cc_http_2xx")} / ${count("cc_http_4xx")} / ${count("cc_http_429")}
  5xx total (502 / 503):   ${count("cc_http_5xx_total")} (${count("cc_http_502")} / ${count("cc_http_503")})
  Conn failures/timeouts:  ${count("cc_conn_failures_or_timeouts")}
  /health availability:    ${rate("cc_health_up")}%
  API process restarts:    ${count("cc_api_process_restarts")}
================================================================================
`;

  return {
    stdout: text,
    [`${REPORT_BASENAME}.md`]: "```\n" + text + "\n```\n",
    [`${REPORT_BASENAME}.json`]: JSON.stringify(data, null, 2),
  };
}
