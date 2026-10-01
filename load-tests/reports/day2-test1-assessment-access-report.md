
================================================================================
# Qloax Day 2 - Test 1: Assessment Access Report
================================================================================
Generated:                  2026-09-30T06:12:05.706Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Assessment ID:              cmsifafam000099s9csfe33pg
Candidates Attempted:       500
Successful Candidates:      500
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
## 2. Assessment Access Operations
- Assessment Fetch:         500 / 500
- Session Status Check:     500 / 500
- Session Resume:           500 / 500
- State Recovery Success:   500 / 500

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint            | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Assessment Fetch (/tests/id)| 2055ms   | 2692ms   | 0ms      | 5469ms   | 2143ms   |
| Session Resume (/resume)   | 1114ms   | 1361ms   | 0ms      | 3495ms   | 1161ms   |
| Combined In-Exam Access    | 1812ms   | 2379ms   | 0ms      | 5469ms   | 1652ms   |
================================================================================
