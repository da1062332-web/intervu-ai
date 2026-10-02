
================================================================================
# Part 3 - Test 2: Qloax Volume Test Report
================================================================================
Generated: 2026-10-02T05:16:18.397Z
Target API: https://skillitrix.onrender.com/api/v1
Assessment ID: cmsifafam000099s9csfe33pg
Test Run ID: run-muqifyhn
Description: Volume test with 30 concurrent candidates generating high volumes of test instances, question manifests, answers, and submissions over 3m. Measures API and database latency under data accumulation.

--------------------------------------------------------------------------------
## 1. Executive Summary & Throughput
- Total HTTP Requests:     2153
- Throughput (RPS):        4.82 req/s
- Overall Error Rate:      0.93%
- Successful Candidates:   87
- Failed Candidates:       20
- Successful Submissions:  87
- Failed Submissions:      0
- Successful Answers:      1174
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
| Overall HTTP Duration | 2521ms  | 1094ms  | 7204ms  | 9310ms  | 0ms     | 30951ms |
| Start Test (Postgres) | 8027ms  | 7001ms  | 9454ms  | 14772ms | 0ms     | 21011ms |
| Snapshot Fetch        | 4159ms  | 2143ms  | 9874ms  | 14837ms | 0ms     | 30951ms |
| Answer Autosave       | 1572ms  | 584ms   | 5806ms  | 8253ms  | 0ms     | 21002ms |
| Telemetry Heartbeat   | 1972ms  | 1146ms  | 4953ms  | 8788ms  | 0ms     | 14751ms |
| Submit Assessment     | 6233ms  | 4985ms  | 11702ms | 13250ms | 0ms     | 19652ms |
================================================================================
