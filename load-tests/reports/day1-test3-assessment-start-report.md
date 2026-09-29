
================================================================================
# Qloax Day 1 - Test 3: Assessment Start Report
================================================================================
Generated:                  2026-09-29T07:17:40.338Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Assessment ID:              cmsifafam000099s9csfe33pg
Candidates Attempted:       500
Successful Candidates:      93
Failed Candidates:          407
Error Rate:                 36.37%

--------------------------------------------------------------------------------
## 1. HTTP Status & Error Breakdown
- HTTP 429 (Rate Limited):  0
- HTTP 4xx (Client Errors): 0
- HTTP 5xx (Server Drops):  431
- Timeouts:                 430
- Connection Resets:        0
- Stream EOF:               1

--------------------------------------------------------------------------------
## 2. Assessment Start & Data Integrity Verification
- Assessment Starts:        93 / 500
- No Duplicate Sessions:    69 / 500
- Zero Data Corruption:     93 / 500

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Assessment Start (/start)  | 90000ms  | 90001ms  | 0ms      | 90043ms  | 80010ms  |
| Snapshot Load (/tests/:id) | 18112ms  | 36323ms  | 0ms      | 41061ms  | 19824ms  |
| Total Provisioning Latency | 90000ms  | 90001ms  | 0ms      | 90043ms  | 70555ms  |
================================================================================
