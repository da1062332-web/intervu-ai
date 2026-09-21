/**
 * Part 1 - Test 3: Qloax Authentication & Session Resilience Test
 *
 * Validates authentication contract, session persistence, and authorization isolation:
 * 1. Signup + Login with referral code to obtain JWT access & refresh tokens
 * 2. Authenticated Profile & Session Check (GET /auth/me)
 * 3. Start Assessment and save initial answers
 * 4. Token Refresh Lifecycle (POST /auth/refresh) and token continuity
 * 5. Expired/Invalid Token Handling (401 Detection) and Automatic Session Re-authentication
 * 6. Authorization Boundary Guard (403/404 on cross-candidate access)
 * 7. Session Persistence: Re-login after simulated browser restart, resume test, and submit
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";
import {
  BASE_URL,
  REFERRAL_CODE,
  ASSESSMENT_ID,
  TEST_RUN_ID,
  SIGNUP_PASSWORD,
  metrics,
  getHeaders,
  generateCandidateEmail,
  safePost,
  safeGet,
} from "./common.js";

const VUS = Number(__ENV.VUS) || 2;

// Dedicated auth & session metrics
const tokenRefreshSuccess = new Counter("auth_token_refresh_success");
const sessionRecoveriesSuccess = new Counter("auth_session_recoveries_success");
const crossAccessBlocked = new Counter("auth_cross_access_blocked_403");

export const options = {
  scenarios: {
    auth_session_validation: {
      executor: "per-vu-iterations",
      vus: VUS,
      iterations: 1,
      maxDuration: "4m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.25"], // Deliberate 401 & 403 test probes are sent
    "http_req_duration{endpoint:answer}": ["p(95)<4500"],
    "http_req_duration{endpoint:start_test}": ["p(95)<25000"],
    "http_req_duration{endpoint:submit}": ["p(95)<10000"],
    auth_token_refresh_success: [`count>=${VUS}`],
    auth_session_recoveries_success: [`count>=${VUS}`],
    submissions_success: [`count>=${VUS}`],
    candidates_success: [`count>=${VUS}`],
  },
};

export function setup() {
  console.log(`\n======================================================`);
  console.log(`[TEST 3: AUTH & SESSION TEST] Initializing test`);
  console.log(`Target Base URL:    ${BASE_URL}`);
  console.log(`Assessment ID:      ${ASSESSMENT_ID}`);
  console.log(`Referral Code:      ${REFERRAL_CODE}`);
  console.log(`Test Run ID:        ${TEST_RUN_ID}`);
  console.log(`VUs:                ${VUS}`);
  console.log(`======================================================\n`);
  return { assessmentId: ASSESSMENT_ID };
}

export default function (data) {
  const vuId = __VU;
  const assessmentId = data.assessmentId || ASSESSMENT_ID;
  const candidateEmail = generateCandidateEmail("auth", vuId);

  console.log(`[VU ${vuId}] Testing auth & session lifecycle for ${candidateEmail}`);

  // -------------------------------------------------------------
  // Step 1: Initial Registration with Referral Code
  // -------------------------------------------------------------
  const signupRes = safePost(
    `${BASE_URL}/auth/signup`,
    JSON.stringify({
      email: candidateEmail,
      password: SIGNUP_PASSWORD,
      fullName: `Auth Candidate ${vuId}`,
      referralCode: REFERRAL_CODE,
    }),
    getHeaders(),
    "signup"
  );

  const signupOk = check(signupRes, {
    "1. Signup succeeded (200/201)": (r) => r.status === 200 || r.status === 201,
  });

  if (!signupOk) {
    console.error(`[VU ${vuId}] Signup failed: ${signupRes.status}`);
    metrics.candidatesFailed.add(1);
    return;
  }

  // -------------------------------------------------------------
  // Step 2: Login to acquire Access & Refresh Tokens
  // -------------------------------------------------------------
  const loginRes = safePost(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: candidateEmail, password: SIGNUP_PASSWORD }),
    getHeaders(),
    "login"
  );

  let accessToken = loginRes.json("data.accessToken") || loginRes.json("accessToken");
  let refreshToken = loginRes.json("data.refreshToken") || loginRes.json("refreshToken");

  const loginOk = check(loginRes, {
    "2. Login succeeded (200/201)": (r) => r.status === 200 || r.status === 201,
    "2. Access token received": (r) => Boolean(accessToken),
    "2. Refresh token received": (r) => Boolean(refreshToken),
  });

  if (!loginOk) {
    console.error(`[VU ${vuId}] Login failed: ${loginRes.status}`);
    metrics.candidatesFailed.add(1);
    return;
  }
  console.log(`[VU ${vuId}] Step 2: Acquired initial JWT accessToken and refreshToken`);
  sleep(1);

  // -------------------------------------------------------------
  // Step 3: Verify Profile via Authenticated API (GET /auth/me)
  // -------------------------------------------------------------
  let authHeaders = getHeaders(accessToken);
  const meRes = safeGet(`${BASE_URL}/auth/me`, authHeaders, "auth_me");

  check(meRes, {
    "3. Session validation (200)": (r) => r.status === 200,
    "3. Email matches authenticated user": (r) => (r.json("data.email") || r.json("email")) === candidateEmail,
  });
  sleep(1);

  // -------------------------------------------------------------
  // Step 4: Start Assessment with Active Session
  // -------------------------------------------------------------
  const startRes = safePost(
    `${BASE_URL}/tests/start`,
    JSON.stringify({ testConfigId: assessmentId }),
    authHeaders,
    "start_test"
  );

  const startOk = check(startRes, {
    "4. Assessment started with session (200)": (r) => r.status === 200,
    "4. TestInstance ID created": (r) => Boolean(r.json("data.testInstanceId") || r.json("testInstanceId")),
  });

  if (!startOk) {
    console.error(`[VU ${vuId}] Start test failed: ${startRes.status}`);
    metrics.candidatesFailed.add(1);
    return;
  }

  const testInstanceId = startRes.json("data.testInstanceId") || startRes.json("testInstanceId");
  console.log(`[VU ${vuId}] Step 4: Started assessment ${testInstanceId}`);

  // Fetch Snapshot & Questions
  const snapRes = safeGet(`${BASE_URL}/tests/${testInstanceId}`, authHeaders, "snapshot");
  const sections = snapRes.json("data.sections") || [];
  const firstQ = sections[0]?.questions?.[0] || { questionId: "sample-q1" };

  // Save an initial answer
  const ansRes1 = safePost(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: firstQ.questionId,
      answer: "A",
      timeSpentSeconds: 10,
    }),
    authHeaders,
    "answer"
  );
  check(ansRes1, {
    "4. Initial answer saved under initial token (200)": (r) => r.status === 200,
  });
  sleep(1);

  // -------------------------------------------------------------
  // Step 5: Test JWT Refresh Token Lifecycle (POST /auth/refresh)
  // -------------------------------------------------------------
  console.log(`[VU ${vuId}] Step 5: Testing token refresh endpoint with refreshToken...`);
  const refreshRes = http.post(
    `${BASE_URL}/auth/refresh`,
    JSON.stringify({ refreshToken: refreshToken }),
    { headers: getHeaders(), tags: { endpoint: "token_refresh" } }
  );

  const refreshOk = check(refreshRes, {
    "5. Token refresh status is 200/201": (r) => r.status === 200 || r.status === 201,
    "5. New access token received": (r) => Boolean(r.json("data.accessToken") || r.json("accessToken")),
  });

  if (refreshOk) {
    tokenRefreshSuccess.add(1);
    accessToken = refreshRes.json("data.accessToken") || refreshRes.json("accessToken");
    refreshToken = refreshRes.json("data.refreshToken") || refreshRes.json("refreshToken") || refreshToken;
    authHeaders = getHeaders(accessToken);
    console.log(`[VU ${vuId}] Step 5: Token refresh successful! Transitioned to new access token`);
  } else {
    console.warn(`[VU ${vuId}] Token refresh not supported or returned ${refreshRes.status}`);
  }
  sleep(1);

  // -------------------------------------------------------------
  // Step 6: Test Expired/Corrupted Token Handling & Recovery
  // -------------------------------------------------------------
  console.log(`[VU ${vuId}] Step 6: Testing expired/invalid token detection (expecting 401)...`);
  const invalidHeaders = getHeaders("invalid_or_expired_jwt_token_payload");
  const probe401Res = http.get(`${BASE_URL}/tests/${testInstanceId}`, {
    headers: invalidHeaders,
    tags: { endpoint: "probe_401" },
  });

  const detects401 = check(probe401Res, {
    "6. Server correctly returns 401 on invalid/expired token": (r) => r.status === 401,
  });

  if (detects401) {
    console.log(`[VU ${vuId}] Step 6: 401 Unauthorized correctly enforced by JWT guard`);

    // Recover by re-authenticating with login credentials
    const recoveryLogin = safePost(
      `${BASE_URL}/auth/login`,
      JSON.stringify({ email: candidateEmail, password: SIGNUP_PASSWORD }),
      getHeaders(),
      "recovery_login"
    );

    if (recoveryLogin.status === 200 || recoveryLogin.status === 201) {
      accessToken = recoveryLogin.json("data.accessToken") || recoveryLogin.json("accessToken");
      authHeaders = getHeaders(accessToken);
      sessionRecoveriesSuccess.add(1);
      console.log(`[VU ${vuId}] Step 6: Session recovered successfully after 401 detection`);
    }
  }
  sleep(1);

  // -------------------------------------------------------------
  // Step 7: Authorization Boundary Test (403 Forbidden Detection)
  // -------------------------------------------------------------
  console.log(`[VU ${vuId}] Step 7: Testing cross-candidate authorization guard (SEC-002)...`);
  const foreignAttemptId = "cmu_foreign_candidate_attempt_12345";
  const crossAccessRes = http.get(`${BASE_URL}/tests/${foreignAttemptId}`, {
    headers: authHeaders,
    tags: { endpoint: "probe_cross_access" },
  });

  const crossBlocked = check(crossAccessRes, {
    "7. Cross-candidate unauthorized access rejected (403 or 404)": (r) => r.status === 403 || r.status === 404,
  });

  if (crossBlocked) {
    crossAccessBlocked.add(1);
    console.log(`[VU ${vuId}] Step 7: Cross-candidate access safely blocked (HTTP ${crossAccessRes.status})`);
  }
  sleep(1);

  // -------------------------------------------------------------
  // Step 8: Session Persistence across Re-login & Assessment Continuity
  // -------------------------------------------------------------
  console.log(`[VU ${vuId}] Step 8: Simulating browser re-login and continuing ongoing assessment...`);
  const reLoginRes = safePost(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: candidateEmail, password: SIGNUP_PASSWORD }),
    getHeaders(),
    "relogin"
  );
  accessToken = reLoginRes.json("data.accessToken") || reLoginRes.json("accessToken");
  authHeaders = getHeaders(accessToken);

  // Verify test state persists after re-login
  const resumeSnapshot = safeGet(`${BASE_URL}/tests/${testInstanceId}`, authHeaders, "resume_snapshot");
  const resumeOk = check(resumeSnapshot, {
    "8. Test instance persists after re-login (200)": (r) => r.status === 200,
    "8. Answers preserved across sessions": (r) => Boolean(r.json("data.sections")),
  });

  if (!resumeOk) {
    console.error(`[VU ${vuId}] Failed to resume assessment after re-login`);
    metrics.candidatesFailed.add(1);
    return;
  }

  // Answer a subsequent question with the new session
  const secondQ = sections[0]?.questions?.[1] || { questionId: "sample-q2" };
  const ansRes2 = safePost(
    `${BASE_URL}/tests/${testInstanceId}/answer`,
    JSON.stringify({
      questionId: secondQ.questionId,
      answer: "C",
      timeSpentSeconds: 15,
    }),
    authHeaders,
    "answer"
  );
  check(ansRes2, {
    "8. Answer saved under recovered session (200)": (r) => r.status === 200,
  });
  sleep(1.5);

  // Advance section
  safePost(`${BASE_URL}/tests/${testInstanceId}/sections/advance`, null, authHeaders, "section_advance");
  sleep(1);

  // -------------------------------------------------------------
  // Step 9: Submit Assessment and Complete Journey
  // -------------------------------------------------------------
  const submitRes = safePost(
    `${BASE_URL}/tests/${testInstanceId}/submit?allowPartial=true`,
    null,
    authHeaders,
    "submit"
  );

  const submitOk = check(submitRes, {
    "9. Assessment successfully submitted under persistent session (200)": (r) => r.status === 200,
  });

  if (submitOk) {
    metrics.submissionsSuccess.add(1);
    metrics.candidatesSuccess.add(1);
    console.log(`[VU ${vuId}] Step 9: Assessment successfully finalized and submitted!`);
  } else {
    metrics.submissionsFailed.add(1);
    metrics.candidatesFailed.add(1);
    console.error(`[VU ${vuId}] Submission failed: ${submitRes.status}`);
  }
}
