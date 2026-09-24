# Qloax & SkillitriX Performance & Load Test Suite

This directory contains automated [k6](https://k6.io/) performance, stress, resilience, and data integrity test suites built against the **real existing API contracts** of the SkillitriX Assessment Platform.

All candidate lifecycles run realistic end-to-end flows:
1. Dynamic Unique Registration with `QLO` Referral Code (`POST /api/v1/auth/signup`)
2. JWT Authentication & Bearer Header Injection (`POST /api/v1/auth/login`)
3. Session Health Verification (`GET /api/v1/auth/me`)
4. Assessment Instance Creation (`POST /api/v1/tests/start`)
5. Full Questions & Sections Deep Snapshot Retrieval (`GET /api/v1/tests/:id`)
6. Sequential Answer Autosaves with Human Think Times (`POST /api/v1/tests/:id/answer`)
7. Section Advance Transitions (`POST /api/v1/tests/:id/sections/advance`)
8. Telemetry & Autosave Health Heartbeats (`POST /api/v1/tests/:id/heartbeat`)
9. Assessment Final Submission with Duplicate Race Prevention (`POST /api/v1/tests/:id/submit?allowPartial=true`)
10. State Resumption & Post-Submission Validation (`GET /api/v1/tests/:id/resume`)

---

## Test Suites Overview

### Part 1: Baseline & Concurrency
- **Smoke Test** (`load-tests/k6-smoke-test.js`): Single-VU sanity check verifying all endpoints and payloads work cleanly.
- **Auth & Session Test** (`load-tests/k6-auth-session-test.js`): Validates session expiration, JWT reuse, and invalid token handling.
- **Concurrency Test** (`load-tests/k6-concurrency-test.js`): Overlapping concurrent candidates exercising section transitions and duplicate submission handling.

### Part 2: Stress, Spike & Capacity
- **1. Gradual Stress Test** (`load-tests/k6-stress-test.js`):
  - Ramps candidates gradually: `10 → 25 → 50 → 100 → 200` VUs.
  - Measures p95/p99 latency, RPS, error rate, 4xx/5xx/401 breakdown, and identifies where performance starts degrading.
- **2. Spike Test** (`load-tests/k6-spike-test.js`):
  - Rapidly surges candidate traffic: `10 → 100 → 200` VUs in seconds.
  - Tests sudden signup, assessment start, answer, section-change, and submission bursts.
  - Evaluates system recovery after traffic returns to baseline.
- **3. Capacity / Breakpoint Test** (`load-tests/k6-breakpoint-test.js`):
  - Gradually ramps virtual users until thresholds or system performance limits are reached.
  - Automatically aborts when latency (>10s) or error rates (>15%) exceed acceptable bounds.
  - Outputs the maximum stable concurrent capacity.

### Part 3: Endurance, Volume & Data Integrity
- **1. Soak / Endurance Test** (`load-tests/k6-soak-test.js`):
  - Runs **25–50 concurrent candidates for 2–4 hours** (default: 35 VUs for 2h).
  - Candidates continuously perform realistic assessment actions.
  - Monitors memory/resource degradation, latency drift, session expiration, failed answers, and submissions over time.
- **2. Volume Test** (`load-tests/k6-volume-test.js`):
  - Generates heavy data volume across candidates, assessments, questions, answers, and submissions.
  - Traverses multiple sections, answering extensive question sets with rich payloads.
  - Measures API and PostgreSQL degradation as data volume accumulates.
- **3. Data Integrity Test** (`load-tests/k6-data-integrity-test.js`):
  - Runs multiple candidates concurrently.
  - Verifies answers are saved against the correct candidate and assessment session.
  - Verifies section changes don't overwrite or wipe existing state.
  - Verifies no answers are lost or duplicated in the database.
  - Verifies each candidate submits exactly once (duplicate submission blocked with HTTP 409).
  - Validates post-submission final state.

---

## Configuration & Environment Variables

All scripts support the following environment overrides:

| Variable | Default | Description |
| --- | --- | --- |
| `BASE_URL` | `https://skillitrix.onrender.com/api/v1` | Base API URL |
| `REFERRAL_CODE` | `QLO` | Referral code required for registration |
| `ASSESSMENT_ID` | `cmsifafam000099s9csfe33pg` | Active assessment config ID |
| `TEST_RUN_ID` | Auto-generated timestamp | Unique test execution identifier |
| `QUICK_RUN` | `false` | Set to `true` for rapid 2-minute smoke verification |
| `VUS` | Test-specific (e.g. 35 for Soak, 25 for Volume, 5 for Integrity) | Concurrent Virtual Users |
| `SOAK_DURATION` | `2h` | Duration for Soak Test (e.g., `2h`, `4h`) |
| `VOLUME_DURATION`| `10m` | Duration for Volume Test (e.g., `10m`, `30m`) |
| `SIGNUP_PASSWORD`| `LoadTest#2026!` | Password used for test accounts |

---

## Running the Tests

### Quick Validation (Smoke Run)
```bash
# Soak Test Quick Smoke (2 minutes)
k6 run -e QUICK_RUN=true load-tests/k6-soak-test.js

# Volume Test Quick Smoke (2 minutes)
k6 run -e QUICK_RUN=true load-tests/k6-volume-test.js

# Data Integrity Test Quick Validation (2 VUs, 1 cycle)
k6 run -e QUICK_RUN=true load-tests/k6-data-integrity-test.js
```

### Full Standard Runs

#### 1. Soak / Endurance Test (2–4 Hours)
```bash
# Standard 2-hour soak test with 35 concurrent candidates
k6 run load-tests/k6-soak-test.js

# 4-hour soak test with 50 concurrent candidates
k6 run -e VUS=50 -e SOAK_DURATION=4h load-tests/k6-soak-test.js
```

#### 2. Volume Test
```bash
# Standard volume test (25 concurrent candidates, 10 minutes)
k6 run load-tests/k6-volume-test.js

# High volume test (40 concurrent candidates, 20 minutes)
k6 run -e VUS=40 -e VOLUME_DURATION=20m load-tests/k6-volume-test.js
```

#### 3. Data Integrity Test
```bash
# Standard Data Integrity test (5 concurrent VUs, 2 full cycles)
k6 run load-tests/k6-data-integrity-test.js

# Heavy Data Integrity test (10 concurrent VUs, 3 full cycles)
k6 run -e VUS=10 -e ITERATIONS=3 load-tests/k6-data-integrity-test.js
```

---

## Performance Reports

Each test run automatically generates an executive Markdown report saved to `load-tests/reports/`:

- `load-tests/reports/stress-test-report.md`
- `load-tests/reports/spike-test-report.md`
- `load-tests/reports/breakpoint-report.md`
- `load-tests/reports/soak-test-report.md`
- `load-tests/reports/volume-test-report.md`
- `load-tests/reports/data-integrity-report.md`
