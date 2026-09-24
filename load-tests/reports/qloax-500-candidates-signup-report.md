
================================================================================
# Qloax Assessment Load Test: 500 Candidates Registration & Signup Report
================================================================================
Generated:                  2026-09-24T11:13:22.660Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Test Run Identifier:        run-qloax-500cand-muffoc83
Virtual Users (VUs):        500 Candidates
Arrival Ramp Window:        60s
Total HTTP Requests:        694 (5.79 req/s)

--------------------------------------------------------------------------------
## 1. Candidate Registration & Authentication Metrics
- Candidates Attempted:     500
- Successful Signups:       193 / 500
- Failed Signups:           307
- Overall Error Rate:       53.10%
- HTTP 429 (Rate Limited):  0
- HTTP 4xx (Client Errors): 0
- HTTP 5xx / Network Drops: 368

--------------------------------------------------------------------------------
## 2. Failure Root Causes & Breakdown
- Rate Limiting (429 Throttler):   0
- Client-Side Errors (4xx status): 0
- Backend 5xx Status Code:         0
- Remote Connection Resets (Host): 0
- HTTP Client/Server Timeouts:     368
- Stream EOF / Premature Closes:   0

--------------------------------------------------------------------------------
## 3. Signup Latency Distribution
| Metric                | Response Time |
|-----------------------|---------------|
| Median (p50)          | 60000ms |
| 90th Percentile (p90) | 60001ms |
| 95th Percentile (p95) | 60001ms |
| 99th Percentile (p99) | 0ms |
| Max Response Time     | 60008ms |
| Average               | 50430ms |

--------------------------------------------------------------------------------
## 4. Session Verification Probe (GET /auth/me) Latency
| Metric                | Response Time |
|-----------------------|---------------|
| Median (p50)          | 11512ms |
| 95th Percentile (p95) | 15001ms |
| Max Response Time     | 15044ms |
| Average               | 10044ms |

--------------------------------------------------------------------------------
## 5. Key Verification Checkpoints
- [PASS] Signup 429 Issue: Zero 429 ThrottlerException errors encountered
- [FAIL] Unique Candidate Creation: 193 accounts created with unique email addresses
- [FAIL] Server Stability: Zero 5xx database, timeout, or server crashes observed
================================================================================
