
================================================================================
# Qloax Day 1 - Test 3: Assessment Start Report
================================================================================
Generated:                  2026-09-29T04:50:32.212Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Assessment ID:              cmsifafam000099s9csfe33pg
Candidates Attempted:       500
Successful Candidates:      29
Failed Candidates:          471
Error Rate:                 45.17%

--------------------------------------------------------------------------------
## 1. HTTP Status & Error Breakdown
- HTTP 429 (Rate Limited):  0
- HTTP 4xx (Client Errors): 0
- HTTP 5xx (Server Drops):  486
- Timeouts:                 486
- Connection Resets:        0
- Stream EOF:               0

--------------------------------------------------------------------------------
## 2. Assessment Start & Data Integrity Verification
- Assessment Starts:        38 / 500
- No Duplicate Sessions:    23 / 500
- Zero Data Corruption:     29 / 500

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Assessment Start (/start)  | 60001ms  | 60001ms  | 0ms      | 60007ms  | 57338ms  |
| Snapshot Load (/tests/:id) | 19335ms  | 30001ms  | 0ms      | 30001ms  | 20711ms  |
| Total Provisioning Latency | 60000ms  | 60001ms  | 0ms      | 60007ms  | 54751ms  |
================================================================================
