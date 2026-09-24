
================================================================================
# Part 2 - Test 1: Qloax Gradual Stress Test Report
================================================================================
Generated: 2026-09-22T10:05:26.033Z
Target API: https://skillitrix.onrender.com/api/v1
Assessment ID: cmsifafam000099s9csfe33pg
Test Run ID: run-mucid9cf
Description: Gradual load ramp: 10 -> 25 -> 50 -> 100 -> 200 candidates. Evaluates throughput, answer autosave latency, and SLA thresholds.

--------------------------------------------------------------------------------
## 1. Executive Summary & Throughput
- Total HTTP Requests:     13
- Throughput (RPS):        0.24 req/s
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
| Overall HTTP Duration | 2560ms  | 1503ms  | 4458ms  | 7242ms  | 0ms     | 11077ms |
| Start Test (Postgres) | 11077ms | 11077ms | 11077ms | 11077ms | 0ms     | 11077ms |
| Snapshot Fetch        | 3446ms  | 3446ms  | 3446ms  | 3446ms  | 0ms     | 3446ms  |
| Answer Autosave       | 832ms   | 764ms   | 1231ms  | 1367ms  | 0ms     | 1503ms  |
| Telemetry Heartbeat   | 1243ms  | 1243ms  | 1243ms  | 1243ms  | 0ms     | 1243ms  |
| Submit Assessment     | 4686ms  | 4686ms  | 4686ms  | 4686ms  | 0ms     | 4686ms  |
================================================================================
