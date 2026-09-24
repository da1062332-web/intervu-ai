import http from "k6/http";
import { Counter, Rate, Trend } from "k6/metrics";

// Environment configurations
export const BASE_URL = (__ENV.BASE_URL || "https://skillitrix.onrender.com/api/v1").replace(/\/+$/, "");
export const APP_URL = (__ENV.APP_URL || "https://app.skillitrix.com").replace(/\/+$/, "");
export const REFERRAL_CODE = __ENV.REFERRAL_CODE || "QLO";
export const ASSESSMENT_ID = __ENV.ASSESSMENT_ID || "cmsifafam000099s9csfe33pg";
export const TEST_RUN_ID = __ENV.TEST_RUN_ID || `run-${Date.now().toString(36)}`;
export const SIGNUP_PASSWORD = __ENV.SIGNUP_PASSWORD || "LoadTest#2026!";

// Custom shared metrics required by specification
export const metrics = {
  reqs4xx: new Counter("errors_4xx"),
  reqs5xx: new Counter("errors_5xx"),
  reqs401: new Counter("errors_401_unauthorized"),
  reqs403: new Counter("errors_403_forbidden"),
  candidatesSuccess: new Counter("candidates_success"),
  candidatesFailed: new Counter("candidates_failed"),
  submissionsSuccess: new Counter("submissions_success"),
  submissionsFailed: new Counter("submissions_failed"),
  answersSuccess: new Counter("answers_success"),
  answersFailed: new Counter("answers_failed"),
  authSessionFailures: new Counter("auth_session_failures"),
  errorRate: new Rate("app_error_rate"),
  loginDuration: new Trend("login_duration_ms"),
  startTestDuration: new Trend("start_test_duration_ms"),
  snapshotDuration: new Trend("snapshot_duration_ms"),
  answerDuration: new Trend("answer_duration_ms"),
  sectionAdvanceDuration: new Trend("section_advance_duration_ms"),
  heartbeatDuration: new Trend("heartbeat_duration_ms"),
  submitDuration: new Trend("submit_duration_ms"),
};

/**
 * Common request headers conforming to the SkillitriX API contract
 */
export function getHeaders(token = null) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    Origin: APP_URL,
    Referer: `${APP_URL}/`,
    "X-Test-Run-Id": TEST_RUN_ID,
    "User-Agent": `k6-qloax-part1/1.0 (VU ${__VU || 1}; Run ${TEST_RUN_ID})`,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Generates a unique dummy candidate email
 */
export function generateCandidateEmail(prefix = "cand", vuId = 1) {
  const rand = Math.floor(Math.random() * 1000000).toString(36);
  return `qloax-${prefix}-vu${vuId}-${TEST_RUN_ID}-${rand}@skillitrix-loadtest.invalid`;
}

/**
 * Tracks HTTP status codes against required error counters
 */
export function trackResponseStatus(res) {
  const status = res.status;
  const isErr = status >= 400;
  metrics.errorRate.add(isErr ? 1 : 0);

  if (status === 401) {
    metrics.reqs401.add(1);
    metrics.authSessionFailures.add(1);
    metrics.reqs4xx.add(1);
  } else if (status === 403) {
    metrics.reqs403.add(1);
    metrics.authSessionFailures.add(1);
    metrics.reqs4xx.add(1);
  } else if (status >= 400 && status < 500) {
    metrics.reqs4xx.add(1);
  } else if (status >= 500) {
    metrics.reqs5xx.add(1);
  }
}

/**
 * Safe POST request wrapper with automatic status tracking
 */
export function safePost(url, payload, headers, tag = "request") {
  const res = http.post(url, payload, {
    headers,
    tags: { endpoint: tag },
    timeout: "60s",
  });
  trackResponseStatus(res);
  return res;
}

/**
 * Safe GET request wrapper with automatic status tracking
 */
export function safeGet(url, headers, tag = "request") {
  const res = http.get(url, {
    headers,
    tags: { endpoint: tag },
    timeout: "60s",
  });
  trackResponseStatus(res);
  return res;
}

/**
 * Generates a clean markdown and console performance report from k6 test metrics
 */
export function generateSummaryReport(data, title, description = "") {
  const getMetricVal = (name, field = "value") => {
    if (data.metrics[name] && data.metrics[name].values) {
      return data.metrics[name].values[field] ?? 0;
    }
    return 0;
  };

  const getLatency = (name) => {
    const m = data.metrics[name];
    if (!m || !m.values) return { avg: "0ms", p90: "0ms", p95: "0ms", p99: "0ms", max: "0ms" };
    const v = m.values;
    const toMs = (n) => `${Math.round(n || 0)}ms`;
    return {
      avg: toMs(v.avg),
      med: toMs(v.med),
      p90: toMs(v["p(90)"]),
      p95: toMs(v["p(95)"]),
      p99: toMs(v["p(99)"]),
      max: toMs(v.max),
    };
  };

  const totalReqs = getMetricVal("http_reqs", "count");
  const reqRate = getMetricVal("http_reqs", "rate").toFixed(2);
  const failRate = (getMetricVal("http_req_failed", "rate") * 100).toFixed(2);
  const err4xx = getMetricVal("errors_4xx", "count");
  const err5xx = getMetricVal("errors_5xx", "count");
  const err401 = getMetricVal("errors_401_unauthorized", "count");
  const err403 = getMetricVal("errors_403_forbidden", "count");
  const candSuccess = getMetricVal("candidates_success", "count");
  const candFailed = getMetricVal("candidates_failed", "count");
  const subsSuccess = getMetricVal("submissions_success", "count");
  const subsFailed = getMetricVal("submissions_failed", "count");
  const ansSuccess = getMetricVal("answers_success", "count");
  const ansFailed = getMetricVal("answers_failed", "count");

  const ansLat = getLatency("answer_duration_ms");
  const startLat = getLatency("start_test_duration_ms");
  const snapLat = getLatency("snapshot_duration_ms");
  const hbLat = getLatency("heartbeat_duration_ms");
  const subLat = getLatency("submit_duration_ms");
  const overallLat = getLatency("http_req_duration");

  const report = `
================================================================================
# ${title}
================================================================================
Generated: ${new Date().toISOString()}
Target API: ${BASE_URL}
Assessment ID: ${ASSESSMENT_ID}
Test Run ID: ${TEST_RUN_ID}
${description ? `Description: ${description}\n` : ""}
--------------------------------------------------------------------------------
## 1. Executive Summary & Throughput
- Total HTTP Requests:     ${totalReqs}
- Throughput (RPS):        ${reqRate} req/s
- Overall Error Rate:      ${failRate}%
- Successful Candidates:   ${candSuccess}
- Failed Candidates:       ${candFailed}
- Successful Submissions:  ${subsSuccess}
- Failed Submissions:      ${subsFailed}
- Successful Answers:      ${ansSuccess}
- Failed Answers:          ${ansFailed}

--------------------------------------------------------------------------------
## 2. HTTP Status & Error Breakdown
- HTTP 4xx Errors:         ${err4xx}
- HTTP 5xx Errors:         ${err5xx}
- 401 Unauthorized:        ${err401}
- 403 Forbidden:           ${err403}

--------------------------------------------------------------------------------
## 3. Latency Metrics (p90, p95, p99)
| Endpoint / Action     | Avg     | Med     | p90     | p95     | p99     | Max     |
|-----------------------|---------|---------|---------|---------|---------|---------|
| Overall HTTP Duration | ${overallLat.avg.padEnd(7)} | ${overallLat.med.padEnd(7)} | ${overallLat.p90.padEnd(7)} | ${overallLat.p95.padEnd(7)} | ${overallLat.p99.padEnd(7)} | ${overallLat.max.padEnd(7)} |
| Start Test (Postgres) | ${startLat.avg.padEnd(7)} | ${startLat.med.padEnd(7)} | ${startLat.p90.padEnd(7)} | ${startLat.p95.padEnd(7)} | ${startLat.p99.padEnd(7)} | ${startLat.max.padEnd(7)} |
| Snapshot Fetch        | ${snapLat.avg.padEnd(7)} | ${snapLat.med.padEnd(7)} | ${snapLat.p90.padEnd(7)} | ${snapLat.p95.padEnd(7)} | ${snapLat.p99.padEnd(7)} | ${snapLat.max.padEnd(7)} |
| Answer Autosave       | ${ansLat.avg.padEnd(7)} | ${ansLat.med.padEnd(7)} | ${ansLat.p90.padEnd(7)} | ${ansLat.p95.padEnd(7)} | ${ansLat.p99.padEnd(7)} | ${ansLat.max.padEnd(7)} |
| Telemetry Heartbeat   | ${hbLat.avg.padEnd(7)} | ${hbLat.med.padEnd(7)} | ${hbLat.p90.padEnd(7)} | ${hbLat.p95.padEnd(7)} | ${hbLat.p99.padEnd(7)} | ${hbLat.max.padEnd(7)} |
| Submit Assessment     | ${subLat.avg.padEnd(7)} | ${subLat.med.padEnd(7)} | ${subLat.p90.padEnd(7)} | ${subLat.p95.padEnd(7)} | ${subLat.p99.padEnd(7)} | ${subLat.max.padEnd(7)} |
================================================================================
`;
  return report;
}

