
================================================================================
# Part 3 - Test 1: Qloax Soak / Endurance Test Report
================================================================================
Generated: 2026-10-02T05:08:04.217Z
Target API: https://skillitrix.onrender.com/api/v1
Assessment ID: cmsifafam000099s9csfe33pg
Test Run ID: run-muqi5d6f
Description: Sustained load of 35 concurrent candidates over 3m. Evaluates memory leaks, latency drift, and session stability.

--------------------------------------------------------------------------------
## 1. Executive Summary & Throughput
- Total HTTP Requests:     3548
- Throughput (RPS):        4.46 req/s
- Overall Error Rate:      0.42%
- Successful Candidates:   266
- Failed Candidates:       2
- Successful Submissions:  266
- Failed Submissions:      0
- Successful Answers:      1354
- Failed Answers:          4
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
| Overall HTTP Duration | 2943ms  | 1418ms  | 7511ms  | 10056ms | 0ms     | 30168ms |
| Start Test (Postgres) | 8372ms  | 7505ms  | 11118ms | 13520ms | 0ms     | 19270ms |
| Snapshot Fetch        | 3648ms  | 2189ms  | 7295ms  | 13528ms | 0ms     | 30168ms |
| Answer Autosave       | 1589ms  | 657ms   | 2754ms  | 8132ms  | 0ms     | 21507ms |
| Telemetry Heartbeat   | 2105ms  | 1232ms  | 5266ms  | 8308ms  | 0ms     | 18981ms |
| Submit Assessment     | 6318ms  | 5296ms  | 8573ms  | 13578ms | 0ms     | 25632ms |
================================================================================
