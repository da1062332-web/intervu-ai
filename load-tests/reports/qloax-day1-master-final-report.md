# Qloax Day 1: 500-Candidate Sequential Load Test — Final Executive Report

**Execution Date:** September 28, 2026  
**Target Environment:** Production-Equivalent (`https://skillitrix.onrender.com/api/v1`)  
**Assessment Target:** `cmsifafam000099s9csfe33pg`  
**Referral Code Target:** `QLO`  
**Test Profile:** 500 Unique Candidates per Test Flow, Executed Sequentially  
**Lead Performance Engineer:** Antigravity AI  

---

## 1. Executive Master Summary & Results Table

All four Day 1 test suites were executed sequentially with **500 unique candidate identities per test** to isolate individual subsystem behavior and identify true bottleneck thresholds.

| Test Flow | Attempted | Successful | Failed | Error Rate | HTTP 429 | HTTP 4xx | HTTP 5xx | Timeouts | Conn Drop/EOF | p50 (ms) | p95 (ms) | p99 (ms) | Max (ms) | Day 1 Verdict |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Signup / Registration** | 500 | 478 | 22 | 2.25% | 0 | 0 | 22 | 0 | 22 (2 rst / 20 EOF) | 18,113 | 34,076 | 38,719 | 41,796 | **FAIL** |
| **2. Auth & Session** | 500 | 63 | 437 | 24.10% | 331 | 331 | 106 | 104 | 2 (0 rst / 2 EOF) | 3,770 | 60,000 | 60,001 | 60,002 | **FAIL** |
| **3. Assessment Start** | 500 | 26 | 474 | 47.02% | 0 | 0 | 505 | 505 | 0 (0 rst / 0 EOF) | 60,001 | 60,001 | 60,005 | 60,010 | **FAIL** |
| **4. Concurrent Access** | 500 | 13 | 487 | 45.51% | 0 | 0 | 487 | 485 | 2 (0 rst / 2 EOF) | 16,260 | 30,000 | 30,001 | 30,001 | **FAIL** |

> **OVERALL DAY 1 VERDICT: FAIL — NOT READY FOR DAY 2**  
> While the registration subsystem demonstrated massive improvements since previous baselines (moving from 38.6% up to 95.6% completion due to Argon2 tuning), the platform is **blocked from proceeding to Day 2**. Severe architectural bottlenecks in PostgreSQL connection pooling, an IP rate-limiting tracker bug on `/auth/refresh`, synchronous question-manifest generation on test starts, and a critical duplicate session bug in `eligibility.service.ts` must be patched first.

---

## 2. Test-by-Test Deep Dive & Flow Metrics

### Test 1: Signup / Registration (500 Unique Candidates)
* **Script:** `load-tests/k6-qloax-500-candidates-130m.js`
* **Workload:** 500 candidates ramped across 60 seconds (`SIGNUP_ONLY=true`).
* **Sub-operations & Latency Profile:**
  * Candidate Registration (`POST /auth/register`): p50 = 18,113ms | p90 = 32,784ms | p95 = 34,076ms | p99 = 38,719ms | Max = 41,796ms
  * Referral Validation (`GET /referrals/code/:code`): p50 = 895ms | p90 = 2,631ms | p95 = 3,378ms | p99 = 4,336ms | Max = 5,361ms
* **Success Criteria Evaluation:**
  * 500/500 successful registration: **478 / 500 (FAILED)**
  * 0 × 429: **0 (PASSED)**
  * 0 × 4xx: **0 (PASSED)**
  * 0 × 5xx: **22 (FAILED - 502/504 Bad Gateway from Render proxy)**
  * 0 timeouts: **0 (PASSED - zero client-side 60s timeouts)**
  * 0 connection resets / EOF: **22 (FAILED - 2 reset by peer, 20 unexpected EOF)**
* **Root Cause:**
  Under 500 concurrent TLS connections over a 60s ramp window, Render's reverse proxy queued incoming sockets faster than the Node.js single-threaded event loop could accept them. As request queues backed up to 34–41s, the proxy dropped 22 sockets with TCP RST / EOF.

---

### Test 2: Authentication & Session (500 Unique Candidates)
* **Script:** `load-tests/day1-test2-auth-session.js`
* **Workload:** 500 candidates ramped across 120 seconds executing: Login -> `/auth/me` -> Session creation check -> `/auth/refresh` -> Identity integrity check.
* **Flow Breakdown:**
  * Login (`POST /auth/login`): 394 passed / 106 failed (104 timed out at 60s, 2 stream EOF)
  * Identity Fetch (`GET /auth/me`): 394 / 394 passed (100% of logged-in users)
  * Session Creation: 394 / 394 passed (100% of logged-in users)
  * Token Refresh (`POST /auth/refresh`): 63 passed / 331 failed (**331 rate-limited with HTTP 429**)
  * Candidate Data Consistency: 63 / 500 passed
* **Latency Profile:**
  * Login: p50 = 38,178ms | p95 = 60,000ms | Max = 60,002ms
  * Auth Me: p50 = 745ms | p95 = 10,637ms | Max = 22,233ms
  * Refresh: p50 = 226ms | p95 = 4,821ms | Max = 10,676ms
* **Critical Code Defect Discovered:**
  * In `apps/api/src/modules/platform/middleware/rate-limit.middleware.ts` (`RateLimitGuard.getTracker()`):
    * `POST /auth/refresh` is annotated with `@Public()` (meaning `req.user` is null).
    * The request body is `{ refreshToken }` (meaning `req.body.email` is null).
    * The tracker falls back directly to `ip:${ip}`.
    * **Impact:** All 500 candidates originating from the load testing machine shared a single global IP rate-limit bucket (100 req/min). The first 100 requests consumed the quota, causing all subsequent candidates (331) to be rejected with `HTTP 429 Too Many Requests`.

---

### Test 3: Assessment Start (500 Unique Candidates)
* **Script:** `load-tests/day1-test3-assessment-start.js`
* **Workload:** 500 registered candidates ramped across 180 seconds executing: Assessment Start -> Duplicate Start Prevention Probe -> Manifest Retrieval -> Integrity Check.
* **Flow Breakdown:**
  * Starts Succeeded: 37 / 500 passed (474 failed with 60s timeout, 1 failed with network drop)
  * No Duplicate Sessions: **0 / 500 passed (CRITICAL BUG)**
  * Manifest Snapshots Retrieved: 26 / 500 passed
  * Manifest Data Corruption: 0 instances of corruption observed among the 26 completed starts
* **Latency Profile:**
  * Start Assessment: p50 = 60,001ms | p95 = 60,001ms | Max = 60,010ms
  * Baseline Snapshot: p50 = 27,494ms | p95 = 30,001ms | Max = 30,002ms
* **Critical Defects Discovered:**
  1. **Provisioning Transaction Bottleneck:**
     `POST /tests/start` executes a monolithic, multi-table synchronous database transaction: reading candidate eligibility, validating referral, selecting question bank items, generating test instances, and writing records. Baseline execution takes ~11.5s to 14.5s per candidate. With Supabase PgBouncer configured at `connection_limit=20`, the theoretical maximum throughput is ~1.74 starts/sec. When 500 candidates hit the endpoint within 180s, the queue backed up indefinitely, causing 474 candidates to time out at 60s.
  2. **Duplicate Session Creation Logic Bug:**
     In `apps/api/src/modules/assessment/services/eligibility.service.ts` (lines 211–216):
     ```typescript
     if (activeTest) {
       await this.prisma.assessmentAttempt.update({
         where: { id: activeTest.id },
         data: { expiresAt: new Date(Date.now() - 1000) },
       });
     }
     ```
     When a candidate double-clicks or re-invokes `POST /tests/start`, the API does **not** return `409 Conflict` or resume the existing attempt. Instead, it forcibly marks the existing attempt as expired and provisions a **duplicate new attempt**.

---

### Test 4: Concurrent Assessment Access (500 Unique Candidates)
* **Script:** `load-tests/day1-test4-concurrent-access.js`
* **Workload:** 500 candidates ramped across 180 seconds accessing their exam session: Assessment Metadata -> Periodic Answer Autosave -> Telemetry Heartbeat -> Resume Verification.
* **Flow Breakdown:**
  * Candidates Attempted: 500
  * Successful Completion: 13 / 500
  * Failed Candidates: 487 / 500 (485 request timeouts, 2 stream EOF)
  * Assessment Fetch (`GET /tests/:id`): 13 / 500 passed
  * Answer Autosave (`POST /tests/:id/answer`): 18 / 500 passed
  * Telemetry Heartbeat (`POST /tests/:id/heartbeat`): 18 / 500 passed
  * Session Resume (`GET /tests/:id/resume`): 18 / 500 passed
  * In-Exam Data Consistency: 13 / 500 passed
* **Latency Profile (Active Candidates):**
  * Assessment Fetch: p50 = 22,415ms | p95 = 30,001ms | Max = 30,001ms
  * Answer Autosave: p50 = 12,766ms | p95 = 20,094ms | Max = 21,101ms
  * Telemetry Heartbeat: p50 = 12,711ms | p95 = 15,594ms | Max = 15,715ms
  * Session Resume: p50 = 19,211ms | p95 = 23,987ms | Max = 24,403ms
  * Combined In-Exam Access: p50 = 16,260ms | p95 = 30,000ms | Max = 30,001ms
* **Root Cause:**
  Because candidates in Test 4 had to ensure an active attempt existed via `POST /tests/start`, the same upstream provisioning bottleneck blocked 485 candidates from ever entering the test. For the candidates who did enter the exam room, every answer autosave and heartbeat hit the saturated database pool, pushing autosave latencies to 12.8s p50 (SLA target is < 500ms).

---

## 3. Infrastructure & Telemetry Monitoring

Throughout the execution of Day 1, health probes and telemetry endpoints (`/health/ready`, `/health/metrics`) revealed critical infrastructure behavior:

### A. PostgreSQL Connection Pool Saturation (Primary Bottleneck)
* **Target Pooler:** Supabase PgBouncer (Port 6543) with `connection_limit=20`.
* **Telemetry Observation:**
  * During peak concurrency in Tests 3 and 4, `/health/ready` failed its health check:
    ```json
    {
      "database": {
        "status": "down",
        "message": "timeout of 5000ms exceeded"
      }
    }
    ```
  * Prisma client instances waited longer than the 5,000ms health check threshold just to acquire a free connection from the pool.
  * Following cessation of load, the connection pool took **~90 to 120 seconds** to drain hanging queries before returning to `status: up`.

### B. Redis & Queue Health
* **Telemetry Observation:**
  * Redis remained `status: up, message: Redis is connected` across all 4 tests.
  * Worker process remained `status: up, message: Worker is initialized`.
  * Background queues (such as referral attribution) processed smoothly without memory leaks or crash loops.

### C. Node.js Event Loop & Memory
* **Telemetry Observation:**
  * Memory Heap: `status: up` (maintained within safe headroom throughout).
  * Memory RSS: `status: up`.
  * Average Request Duration tracked by Node.js telemetry spiked to **154,439ms** during saturation.
  * `active_requests` counter in telemetry registered underflows (`-112`) due to dropped TCP connections failing to trigger normal Express completion handlers.

---

## 4. Before vs. After Comparison (September 24 vs. Today)

| Component / Metric | Historical Baseline (Sep 24, 2026) | Day 1 Execution (Sep 28, 2026) | Trend & Impact |
| :--- | :---: | :---: | :--- |
| **Signup Success Rate** | 38.6% (193 / 500) | **95.6% (478 / 500)** | **+147.7% Improvement** (Argon2 optimized to 1 iter / 8MB; async referral redemption) |
| **Signup Timeouts** | 368 timeouts | **0 timeouts** | **100% eliminated** on registration |
| **Signup Peak Latency** | 60,000ms+ (timeouts) | **41,796ms** | Substantial improvement, though proxy queueing still causes drops |
| **Auth/Session Completion** | Untested at 500 scale | **12.6% (63 / 500)** | Blocked by single-IP rate limit tracker on `/auth/refresh` (331 x 429s) |
| **Assessment Start Throughput**| Untested at 500 scale | **5.2% (26 / 500)** | Synchronous DB provisioning saturated PgBouncer (20 conn limit) |
| **Duplicate Session Handling**| Not verified under load | **0% passed (Bug confirmed)** | Re-starting forces expiration and creates duplicate attempt |

---

## 5. Required Action Items Before Day 2 Execution

To achieve a **PASS** on Day 1 and unlock **Day 2 (Real-time Test Takers & Submission Flow)**, the following four engineering remediations are required:

1. **Fix Rate Limit Tracker for Public Refresh Endpoint:**
   * **Location:** `apps/api/src/modules/platform/middleware/rate-limit.middleware.ts`
   * **Action:** When `req.user` is absent on `POST /auth/refresh`, extract the candidate identifier or hash of `req.body.refreshToken` rather than falling back to `ip:${ip}`. This prevents 500 students in a shared computer lab or NAT network from sharing a 100 req/min quota.
2. **Eliminate Synchronous Start Test Provisioning Monolith:**
   * **Location:** `apps/api/src/modules/assessment/services/assessment.service.ts`
   * **Action:** Cache compiled assessment templates and question sets in Redis. Avoid executing 15 sequential database writes inside a single synchronous transaction on test entry. Pre-provision candidate test attempts asynchronously or serve questions from read-replicas.
3. **Fix Duplicate Session Logic:**
   * **Location:** `apps/api/src/modules/assessment/services/eligibility.service.ts` (lines 211–216)
   * **Action:** When `activeTest` is found, do **not** set `expiresAt: now - 1000` and create a second attempt. Return the existing attempt ID or return `409 Conflict` so the frontend seamlessly resumes the active attempt.
4. **Tune PostgreSQL Connection Pooler:**
   * **Action:** Increase Supabase PgBouncer pool ceiling from 20 to at least 50–60 active connections, or configure aggressive statement timeouts (e.g. 5,000ms) to abort abandoned connection queries instantly.
