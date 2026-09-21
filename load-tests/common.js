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
