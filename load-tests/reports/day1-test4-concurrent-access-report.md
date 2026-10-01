
================================================================================
# Qloax Day 1 - Test 4: Concurrent Assessment Access Report
================================================================================
Generated:                  2026-09-30T05:51:36.786Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Assessment ID:              cmsifafam000099s9csfe33pg
Candidates Attempted:       1
Successful Candidates:      1
Failed Candidates:          0
Error Rate:                 0.00%

--------------------------------------------------------------------------------
## 1. HTTP Status & Error Breakdown
- HTTP 429 (Rate Limited):  0
- HTTP 4xx (Client Errors): 0
- HTTP 5xx (Server Drops):  0
- Timeouts:                 0
- Connection Resets:        0
- Stream EOF:               0

--------------------------------------------------------------------------------
## 2. Concurrent Assessment Operations
- Assessment Fetch:         1 / 1
- Answer Autosave:          1 / 1
- Telemetry Heartbeat:      1 / 1
- Session Resume:           1 / 1
- Data Consistency:         1 / 1

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Assessment Fetch (/tests/id)| 2763ms   | 2763ms   | 0ms      | 2763ms   | 2763ms   |
| Answer Autosave (/answer)  | 1579ms   | 1579ms   | 0ms      | 1579ms   | 1579ms   |
| Telemetry Heartbeat (/hb)  | 1217ms   | 1217ms   | 0ms      | 1217ms   | 1217ms   |
| Session Resume (/resume)   | 1045ms   | 1045ms   | 0ms      | 1045ms   | 1045ms   |
| Combined In-Exam Access    | 1398ms   | 2585ms   | 0ms      | 2763ms   | 1651ms   |
================================================================================
