
================================================================================
# Part 2 - Test 3: Qloax Capacity & Breakpoint Test Report
================================================================================
Generated: 2026-09-22T10:09:09.101Z
Target API: https://skillitrix.onrender.com/api/v1
Assessment ID: cmsifafam000099s9csfe33pg
Test Run ID: run-mucii1gt
Description: Stepped Capacity Audit up to 250 concurrent candidates. Identifies SLA breaking limits.

--------------------------------------------------------------------------------
## 1. Executive Summary & Throughput
- Total HTTP Requests:     12
- Throughput (RPS):        0.22 req/s
- Overall Error Rate:      0.00%
- Successful Candidates:   1
- Failed Candidates:       0
- Successful Submissions:  1
- Failed Submissions:      0
- Successful Answers:      5
- Failed Answers:          0

--------------------------------------------------------------------------------
## 2. HTTP Status & Error Breakdown
- HTTP 4xx Errors:         0
- HTTP 5xx Errors:         0
- 401 Unauthorized:        0
- 403 Forbidden:           0

--------------------------------------------------------------------------------
## 3. Latency Metrics (p90, p95, p99)
| Endpoint / Action     | Avg     | Med     | p90     | p95     | p99     | Max     |
|-----------------------|---------|---------|---------|---------|---------|---------|
| Overall HTTP Duration | 2661ms  | 1368ms  | 4570ms  | 7750ms  | 0ms     | 11481ms |
| Start Test (Postgres) | 11481ms | 11481ms | 11481ms | 11481ms | 0ms     | 11481ms |
| Snapshot Fetch        | 3351ms  | 3351ms  | 3351ms  | 3351ms  | 0ms     | 3351ms  |
| Answer Autosave       | 678ms   | 574ms   | 955ms   | 1014ms  | 0ms     | 1074ms  |
| Telemetry Heartbeat   | 1031ms  | 1031ms  | 1031ms  | 1031ms  | 0ms     | 1031ms  |
| Submit Assessment     | 4697ms  | 4697ms  | 4697ms  | 4697ms  | 0ms     | 4697ms  |
================================================================================

--------------------------------------------------------------------------------
## 4. Capacity & Breakpoint Evaluation
- Peak Concurrency Evaluated:       1 VUs
- SLA Violations (Latency > 5s/Err): 0
- Breakpoint Status:                STABLE WITHIN TESTED RANGE
- Maximum Stable Capacity Estimate: ~1 Concurrent Candidates
- Bottleneck Indicator:             Healthy within tested boundaries
================================================================================
