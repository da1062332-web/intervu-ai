
================================================================================
# Qloax Day 1 - Test 2: Authentication & Session Report
================================================================================
Generated:                  2026-09-29T04:43:10.174Z
Target Environment:         https://skillitrix.onrender.com/api/v1
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
## 2. Authentication & Session Checks
- Login Success:            500 / 500
- /auth/me Validation:      500 / 500
- Refresh Token Rotation:   500 / 500
- 401 Expiration Guard:     500 / 500
- 403/404 Ownership Guard:  500 / 500

--------------------------------------------------------------------------------
## 3. Latency Distribution
| Flow / Endpoint        | p50      | p95      | p99      | Max      | Avg      |
|------------------------|----------|----------|----------|----------|----------|
| Login (POST /auth/login)| 7237ms   | 9756ms   | 0ms      | 11380ms  | 7223ms   |
| Profile (GET /auth/me) | 148ms    | 367ms    | 0ms      | 6645ms   | 247ms    |
| Refresh (/auth/refresh)| 7181ms   | 9788ms   | 0ms      | 12663ms  | 6963ms   |
| Combined Auth Flow     | 6038ms   | 9557ms   | 0ms      | 12663ms  | 4811ms   |
================================================================================
