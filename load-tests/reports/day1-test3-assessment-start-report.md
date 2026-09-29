
================================================================================
# Qloax Day 1 - Test 3: Assessment Start Report
================================================================================
Generated:                  2026-09-29T05:22:41.245Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Assessment ID:              cmsifafam000099s9csfe33pg
Candidates Attempted:       500
Successful Candidates:      43
Failed Candidates:          457
Error Rate:                 43.04%

--------------------------------------------------------------------------------
## 1. HTTP Status & Error Breakdown
- HTTP 429 (Rate Limited):  0
- HTTP 4xx (Client Errors): 0
- HTTP 5xx (Server Drops):  464
- Timeouts:                 450
- Connection Resets:        8
- Stream EOF:               6

--------------------------------------------------------------------------------
## 2. Assessment Start & Data Integrity Verification
- Assessment Starts:        46 / 500
- No Duplicate Sessions:    39 / 500
- Zero Data Corruption:     43 / 500

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Assessment Start (/start)  | 90001ms  | 90002ms  | 0ms      | 90007ms  | 84312ms  |
| Snapshot Load (/tests/:id) | 30556ms  | 44555ms  | 0ms      | 45001ms  | 31294ms  |
| Total Provisioning Latency | 90001ms  | 90001ms  | 0ms      | 90007ms  | 79728ms  |
================================================================================
