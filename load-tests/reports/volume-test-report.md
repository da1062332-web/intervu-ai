
================================================================================
# Part 3 - Test 2: Qloax Volume Test Report
================================================================================
Generated: 2026-09-23T07:39:02.307Z
Target API: https://skillitrix.onrender.com/api/v1
Assessment ID: cmsifafam000099s9csfe33pg
Test Run ID: run-mudskug2
Description: Volume test with 25 concurrent candidates generating high volumes of test instances, question manifests, answers, and submissions over 10m. Measures API and database latency under data accumulation.

--------------------------------------------------------------------------------
## 1. Executive Summary & Throughput
- Total HTTP Requests:     22
- Throughput (RPS):        0.25 req/s
- Overall Error Rate:      0.00%
- Successful Candidates:   1
- Failed Candidates:       0
- Successful Submissions:  1
- Failed Submissions:      0
- Successful Answers:      12
- Failed Answers:          0
- Data Mismatches:         0

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
| Overall HTTP Duration | 2163ms  | 1439ms  | 3819ms  | 5020ms  | 0ms     | 11724ms |
| Start Test (Postgres) | 11724ms | 11724ms | 11724ms | 11724ms | 0ms     | 11724ms |
| Snapshot Fetch        | 3495ms  | 3495ms  | 3495ms  | 3495ms  | 0ms     | 3495ms  |
| Answer Autosave       | 839ms   | 573ms   | 1513ms  | 1616ms  | 0ms     | 1694ms  |
| Telemetry Heartbeat   | 1324ms  | 1324ms  | 1324ms  | 1324ms  | 0ms     | 1324ms  |
| Submit Assessment     | 5081ms  | 5081ms  | 5081ms  | 5081ms  | 0ms     | 5081ms  |
================================================================================
