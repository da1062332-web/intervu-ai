
================================================================================
# Qloax Assessment Load Test: 500 Candidates Registration & Signup Report
================================================================================
Generated:                  2026-09-29T04:40:04.882Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Test Run Identifier:        run-qloax-500cand-mum6tte9
Virtual Users (VUs):        500 Candidates
Arrival Ramp Window:        150s
Total HTTP Requests:        1001 (6.60 req/s)

--------------------------------------------------------------------------------
## 1. Candidate Registration & Authentication Metrics
- Candidates Attempted:     500
- Successful Signups:       500 / 500
- Failed Signups:           0
- Overall Error Rate:       0.00%
- HTTP 429 (Rate Limited):  0
- HTTP 4xx (Client Errors): 0
- HTTP 5xx / Network Drops: 0

--------------------------------------------------------------------------------
## 2. Failure Root Causes & Breakdown
- Rate Limiting (429 Throttler):   0
- Client-Side Errors (4xx status): 0
- Backend 5xx Status Code:         0
- Remote Connection Resets (Host): 0
- HTTP Client/Server Timeouts:     0
- Stream EOF / Premature Closes:   0

--------------------------------------------------------------------------------
## 3. Signup Latency Distribution
| Metric                | Response Time |
|-----------------------|---------------|
| Median (p50)          | 1286ms |
| 90th Percentile (p90) | 4696ms |
| 95th Percentile (p95) | 6048ms |
| 99th Percentile (p99) | 0ms |
| Max Response Time     | 9490ms |
| Average               | 2148ms |

--------------------------------------------------------------------------------
## 4. Session Verification Probe (GET /auth/me) Latency
| Metric                | Response Time |
|-----------------------|---------------|
| Median (p50)          | 152ms |
| 95th Percentile (p95) | 1885ms |
| Max Response Time     | 4167ms |
| Average               | 312ms |

--------------------------------------------------------------------------------
## 5. Key Verification Checkpoints
- [PASS] Signup 429 Issue: Zero 429 ThrottlerException errors encountered
- [PASS] Unique Candidate Creation: 500 accounts created with unique email addresses
- [PASS] Server Stability: Zero 5xx database, timeout, or server crashes observed
================================================================================
