
================================================================================
# Qloax Day 1 - Test 3: Assessment Start Report
================================================================================
Generated:                  2026-09-28T06:56:39.428Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Assessment ID:              cmsifafam000099s9csfe33pg
Candidates Attempted:       500
Successful Candidates:      26
Failed Candidates:          474
Error Rate:                 47.02%

--------------------------------------------------------------------------------
## 1. HTTP Status & Error Breakdown
- HTTP 429 (Rate Limited):  0
- HTTP 4xx (Client Errors): 0
- HTTP 5xx (Server Drops):  505
- Timeouts:                 505
- Connection Resets:        0
- Stream EOF:               0

--------------------------------------------------------------------------------
## 2. Assessment Start & Data Integrity Verification
- Assessment Starts:        37 / 500
- No Duplicate Sessions:    0 / 500
- Zero Data Corruption:     26 / 500

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Assessment Start (/start)  | 60001ms  | 60001ms  | 0ms      | 60010ms  | 57413ms  |
| Snapshot Load (/tests/:id) | 27494ms  | 30001ms  | 0ms      | 30001ms  | 25274ms  |
| Total Provisioning Latency | 60000ms  | 60001ms  | 0ms      | 60010ms  | 55198ms  |
================================================================================
