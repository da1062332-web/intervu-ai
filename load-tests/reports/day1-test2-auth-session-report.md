
================================================================================
# Qloax Day 1 - Test 2: Authentication & Session Report
================================================================================
Generated:                  2026-09-28T06:38:55.899Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Candidates Attempted:       500
Successful Candidates:      63
Failed Candidates:          437
Error Rate:                 24.10%

--------------------------------------------------------------------------------
## 1. HTTP Status & Error Breakdown
- HTTP 429 (Rate Limited):  331
- HTTP 4xx (Client Errors): 331
- HTTP 5xx (Server Drops):  106
- Timeouts:                 104
- Connection Resets:        0
- Stream EOF:               2

--------------------------------------------------------------------------------
## 2. Authentication & Session Checks
- Login Success:            411 / 500
- /auth/me Validation:      411 / 500
- Refresh Token Rotation:   63 / 500
- 401 Expiration Guard:     411 / 500
- 403/404 Ownership Guard:  308 / 500

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint        | p50      | p95      | p99      | Max      | Avg      |
|------------------------|----------|----------|----------|----------|----------|
| Login (POST /auth/login)| 38178ms  | 60001ms  | 0ms      | 60002ms  | 38201ms  |
| Profile (GET /auth/me) | 1278ms   | 4950ms   | 0ms      | 7031ms   | 1803ms   |
| Refresh (/auth/refresh)| 860ms    | 20911ms  | 0ms      | 30001ms  | 4073ms   |
| Combined Auth Flow     | 3770ms   | 60000ms  | 0ms      | 60002ms  | 16125ms  |
================================================================================
