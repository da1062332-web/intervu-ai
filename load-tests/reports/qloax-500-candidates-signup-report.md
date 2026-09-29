
================================================================================
# Qloax Assessment Load Test: 500 Candidates Registration & Signup Report
================================================================================
Generated:                  2026-09-28T06:33:57.807Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Test Run Identifier:        run-qloax-500cand-mukvgf1q
Virtual Users (VUs):        500 Candidates
Arrival Ramp Window:        60s
Total HTTP Requests:        979 (10.28 req/s)

--------------------------------------------------------------------------------
## 1. Candidate Registration & Authentication Metrics
- Candidates Attempted:     500
- Successful Signups:       478 / 500
- Failed Signups:           22
- Overall Error Rate:       2.25%
- HTTP 429 (Rate Limited):  0
- HTTP 4xx (Client Errors): 0
- HTTP 5xx / Network Drops: 22

--------------------------------------------------------------------------------
## 2. Failure Root Causes & Breakdown
- Rate Limiting (429 Throttler):   0
- Client-Side Errors (4xx status): 0
- Backend 5xx Status Code:         0
- Remote Connection Resets (Host): 2
- HTTP Client/Server Timeouts:     0
- Stream EOF / Premature Closes:   20

--------------------------------------------------------------------------------
## 3. Signup Latency Distribution
| Metric                | Response Time |
|-----------------------|---------------|
| Median (p50)          | 18113ms |
| 90th Percentile (p90) | 32784ms |
| 95th Percentile (p95) | 34076ms |
| 99th Percentile (p99) | 0ms |
| Max Response Time     | 41796ms |
| Average               | 17841ms |

--------------------------------------------------------------------------------
## 4. Session Verification Probe (GET /auth/me) Latency
| Metric                | Response Time |
|-----------------------|---------------|
| Median (p50)          | 283ms |
| 95th Percentile (p95) | 3129ms |
| Max Response Time     | 5081ms |
| Average               | 783ms |

--------------------------------------------------------------------------------
## 5. Key Verification Checkpoints
- [PASS] Signup 429 Issue: Zero 429 ThrottlerException errors encountered
- [FAIL] Unique Candidate Creation: 478 accounts created with unique email addresses
- [FAIL] Server Stability: Zero 5xx database, timeout, or server crashes observed
================================================================================
