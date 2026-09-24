
================================================================================
# Part 3 - Test 3: Qloax Data Integrity Test Report
================================================================================
Generated: 2026-09-23T07:46:36.222Z
Target API: https://skillitrix.onrender.com/api/v1
Assessment ID: cmsifafam000099s9csfe33pg
Test Run ID: run-mudsukot
Description: Data Integrity validation across 5 concurrent candidates.
Integrity Verdict: PASSED - All answers verified, zero lost or duplicated records, exactly-once submission enforced.
- Lost Answers: 0
- Duplicate Answers in DB: 0
- State Overwrites on Section Change: 0
- Duplicate Submissions Blocked (409): 1

--------------------------------------------------------------------------------
## 1. Executive Summary & Throughput
- Total HTTP Requests:     16
- Throughput (RPS):        0.31 req/s
- Overall Error Rate:      0.00%
- Successful Candidates:   1
- Failed Candidates:       0
- Successful Submissions:  1
- Failed Submissions:      0
- Successful Answers:      4
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
| Overall HTTP Duration | 2548ms  | 1453ms  | 4027ms  | 6322ms  | 0ms     | 11744ms |
| Start Test (Postgres) | 11744ms | 11744ms | 11744ms | 11744ms | 0ms     | 11744ms |
| Snapshot Fetch        | 3542ms  | 3542ms  | 3542ms  | 3542ms  | 0ms     | 3542ms  |
| Answer Autosave       | 1013ms  | 1172ms  | 1362ms  | 1386ms  | 0ms     | 1410ms  |
| Telemetry Heartbeat   | 1497ms  | 1497ms  | 1497ms  | 1497ms  | 0ms     | 1497ms  |
| Submit Assessment     | 4516ms  | 4516ms  | 4516ms  | 4516ms  | 0ms     | 4516ms  |
================================================================================
