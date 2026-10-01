
================================================================================
# Qloax Day 3 - Test 4: Duplicate Submission & Idempotency Report
================================================================================
Generated:                  2026-10-01T09:34:31.322Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Assessment ID:              cmsifafam000099s9csfe33pg
Candidates Attempted:       500
Successful Candidates:      500
Failed Candidates:          0
Overall Error Rate:         0.00%

--------------------------------------------------------------------------------
## 1. HTTP Status & Error Breakdown
- HTTP 429 (Rate Limited):  0
- HTTP 4xx (Client Errors): 0
- HTTP 5xx (Server Drops):  0
- Timeouts:                 0
- Connection Resets:        0
- Stream EOF:               0

--------------------------------------------------------------------------------
## 2. Idempotency & Duplicate Guard Operations
- Primary Submissions:      500 / 500
- Duplicate Submits Tested: 1000 (2 per candidate)
- Duplicate Submits Guarded:1000 / 1000
- Duplicate Records Created:0 (Should be 0)
- State Verified Correct:   500 / 500

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Primary Submit (/submit)   | 6452ms   | 13315ms  | 0ms      | 22204ms  | 7170ms   |
| Duplicate Submit (/submit) | 939ms    | 3409ms   | 0ms      | 14863ms  | 1335ms   |
| Total Candidate Flow       | 33466ms  | 44457ms  | 0ms      | 150109ms | 36431ms  |
================================================================================
