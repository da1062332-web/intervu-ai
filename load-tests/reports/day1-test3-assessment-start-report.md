
================================================================================
# Qloax Day 1 - Test 3: Assessment Start Report
================================================================================
Generated:                  2026-09-29T06:10:46.796Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Assessment ID:              cmsifafam000099s9csfe33pg
Candidates Attempted:       500
Successful Candidates:      13
Failed Candidates:          487
Error Rate:                 46.52%

--------------------------------------------------------------------------------
## 1. HTTP Status & Error Breakdown
- HTTP 429 (Rate Limited):  0
- HTTP 4xx (Client Errors): 0
- HTTP 5xx (Server Drops):  495
- Timeouts:                 495
- Connection Resets:        0
- Stream EOF:               0

--------------------------------------------------------------------------------
## 2. Assessment Start & Data Integrity Verification
- Assessment Starts:        32 / 500
- No Duplicate Sessions:    24 / 500
- Zero Data Corruption:     13 / 500

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Assessment Start (/start)  | 90001ms  | 90001ms  | 0ms      | 90008ms  | 86081ms  |
| Snapshot Load (/tests/:id) | 45000ms  | 45001ms  | 0ms      | 45001ms  | 41090ms  |
| Total Provisioning Latency | 90000ms  | 90001ms  | 0ms      | 90008ms  | 83375ms  |
================================================================================
