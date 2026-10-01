
================================================================================
# Qloax Day 3 - Test 5: Data Integrity Audit Report
================================================================================
Generated:                  2026-10-01T09:49:42.540Z
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
## 2. Integrity Verification
- Answers Persisted:        1000 (Target: 1000)
- Section States Verified:  500 / 500
- Submission Status Verified:500 / 500
- Data Mismatches Detected: 0 (Should be 0)

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Submission (/submit)       | 6354ms   | 7722ms   | 0ms      | 11611ms  | 6523ms   |
| Verify State (/resume)     | 2757ms   | 4617ms   | 0ms      | 6900ms   | 2949ms   |
| Total Candidate Flow       | 38205ms  | 41347ms  | 0ms      | 46285ms  | 38260ms  |
================================================================================
