
================================================================================
# Qloax Day 1 - Test 4: Concurrent Assessment Access Report
================================================================================
Generated:                  2026-09-28T07:19:00.975Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Assessment ID:              cmsifafam000099s9csfe33pg
Candidates Attempted:       500
Successful Candidates:      13
Failed Candidates:          487
Error Rate:                 45.51%

--------------------------------------------------------------------------------
## 1. HTTP Status & Error Breakdown
- HTTP 429 (Rate Limited):  0
- HTTP 4xx (Client Errors): 0
- HTTP 5xx (Server Drops):  487
- Timeouts:                 485
- Connection Resets:        0
- Stream EOF:               2

--------------------------------------------------------------------------------
## 2. Concurrent Assessment Operations
- Assessment Fetch:         13 / 500
- Answer Autosave:          18 / 500
- Telemetry Heartbeat:      18 / 500
- Session Resume:           18 / 500
- Data Consistency:         13 / 500

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Assessment Fetch (/tests/id)| 22415ms  | 30001ms  | 0ms      | 30001ms  | 23382ms  |
| Answer Autosave (/answer)  | 12766ms  | 20094ms  | 0ms      | 21101ms  | 13985ms  |
| Telemetry Heartbeat (/hb)  | 12711ms  | 15594ms  | 0ms      | 15715ms  | 11798ms  |
| Session Resume (/resume)   | 19211ms  | 23987ms  | 0ms      | 24403ms  | 19369ms  |
| Combined In-Exam Access    | 16260ms  | 30000ms  | 0ms      | 30001ms  | 17133ms  |
================================================================================
