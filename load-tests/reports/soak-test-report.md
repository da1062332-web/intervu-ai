
================================================================================
# Part 3 - Test 1: Qloax Soak / Endurance Test Report
================================================================================
Generated: 2026-09-23T07:27:44.122Z
Target API: https://skillitrix.onrender.com/api/v1
Assessment ID: cmsifafam000099s9csfe33pg
Test Run ID: run-muds6b5l
Description: Sustained load of 35 concurrent candidates over 2h. Evaluates memory leaks, latency drift, and session stability.

--------------------------------------------------------------------------------
## 1. Executive Summary & Throughput
- Total HTTP Requests:     13
- Throughput (RPS):        0.21 req/s
- Overall Error Rate:      0.00%
- Successful Candidates:   1
- Failed Candidates:       0
- Successful Submissions:  1
- Failed Submissions:      0
- Successful Answers:      5
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
| Overall HTTP Duration | 2639ms  | 1800ms  | 4530ms  | 7535ms  | 0ms     | 11678ms |
| Start Test (Postgres) | 11678ms | 11678ms | 11678ms | 11678ms | 0ms     | 11678ms |
| Snapshot Fetch        | 3476ms  | 3476ms  | 3476ms  | 3476ms  | 0ms     | 3476ms  |
| Answer Autosave       | 861ms   | 557ms   | 1481ms  | 1708ms  | 0ms     | 1936ms  |
| Telemetry Heartbeat   | 1222ms  | 1222ms  | 1222ms  | 1222ms  | 0ms     | 1222ms  |
| Submit Assessment     | 4773ms  | 4773ms  | 4773ms  | 4773ms  | 0ms     | 4773ms  |
================================================================================
