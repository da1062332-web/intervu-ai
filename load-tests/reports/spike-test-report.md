
================================================================================
# Part 2 - Test 2: Qloax Spike & Recovery Test Report
================================================================================
Generated: 2026-09-22T10:07:48.749Z
Target API: https://skillitrix.onrender.com/api/v1
Assessment ID: cmsifafam000099s9csfe33pg
Test Run ID: run-mucigbgt
Description: Spike Profile: 10 -> 100 -> 200 candidates. Tests sudden traffic surges and verifies post-spike system recovery.

--------------------------------------------------------------------------------
## 1. Executive Summary & Throughput
- Total HTTP Requests:     11
- Throughput (RPS):        0.23 req/s
- Overall Error Rate:      0.00%
- Successful Candidates:   1
- Failed Candidates:       0
- Successful Submissions:  1
- Failed Submissions:      0
- Successful Answers:      4
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
| Overall HTTP Duration | 2912ms  | 1711ms  | 4567ms  | 8111ms  | 0ms     | 11654ms |
| Start Test (Postgres) | 11655ms | 11655ms | 11655ms | 11655ms | 0ms     | 11655ms |
| Snapshot Fetch        | 3610ms  | 3610ms  | 3610ms  | 3610ms  | 0ms     | 3610ms  |
| Answer Autosave       | 697ms   | 579ms   | 994ms   | 1071ms  | 0ms     | 1148ms  |
| Telemetry Heartbeat   | 1424ms  | 1424ms  | 1424ms  | 1424ms  | 0ms     | 1424ms  |
| Submit Assessment     | 4568ms  | 4568ms  | 4568ms  | 4568ms  | 0ms     | 4568ms  |
================================================================================
