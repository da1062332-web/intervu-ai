
================================================================================
# Qloax Assessment Load Test Report: 500 Candidates (130-Minute Complete Exam)
================================================================================
Generated:              2026-10-02T04:54:06.940Z
Target Environment:     https://skillitrix.onrender.com/api/v1
Assessment ID:          cmsifafam000099s9csfe33pg
Test Run Identifier:    run-qloax-500cand-muqhnf4r
Virtual Users (VUs):    5 Candidates
Configured Duration:    120s (~2.0 minutes)
Candidate Ramp Window:  5s

--------------------------------------------------------------------------------
## 1. Executive Throughput & Error Summary
- Total HTTP Requests:             311
- Throughput (RPS):                2.17 req/s
- Overall Error Rate:              0.00%
- Candidates Registered:           5 / 5
- Assessments Started:             5 / 5
- Answers Autosaved:               215
- Answers Modified (Review):       42
- Telemetry Heartbeats:            40
- Section Transitions:             20

--------------------------------------------------------------------------------
## 2. Coding Section Performance (Compile & Execution)
- Code Runs Executed (Public):     0
- Code Submissions (Full Suite):   0
- Capacity Rejections (HTTP 503):  0
- Execution Errors:                0
- Coding Run Latency (p95):        0ms (Avg: 0ms)
- Coding Submit Latency (p95):     0ms (Avg: 0ms)

--------------------------------------------------------------------------------
## 3. Final Minute Submissions Breakdown
- Manual Submissions (Early):      5
- Automatic Submissions (Timeout): 0
- Failed Submissions:              0
- Duplicate Submissions Blocked:   5
- Manual Submit Latency (p95):     4874ms (Avg: 4777ms)
- Auto Submit Latency (p95):       0ms (Avg: 0ms)

--------------------------------------------------------------------------------
## 4. Data Integrity & Verification
- State Integrity Verified:        5
- Data Mismatches / Lost Answers:  0

--------------------------------------------------------------------------------
## 5. Comprehensive Latency Distribution Table
| Endpoint / Action             | Avg     | Med     | p90     | p95     | p99     | Max     |
|-------------------------------|---------|---------|---------|---------|---------|---------|
| Start Assessment (POST)       | 6872ms  | 6997ms  | 7145ms  | 7157ms  | 0ms     | 7168ms  |
| Snapshot Manifest Load (GET)  | 2238ms  | 2138ms  | 2566ms  | 2633ms  | 0ms     | 2699ms  |
| Answer Autosave (POST)        | 583ms   | 465ms   | 1100ms  | 1151ms  | 0ms     | 2236ms  |
| Section Advancement (POST)    | 2842ms  | 2825ms  | 2956ms  | 2959ms  | 0ms     | 2992ms  |
| Telemetry Heartbeat (POST)    | 325ms   | 136ms   | 1397ms  | 1495ms  | 0ms     | 1913ms  |
| Coding Public Run (POST)      | 0ms     | 0ms     | 0ms     | 0ms     | 0ms     | 0ms     |
| Coding Full Submit (POST)     | 0ms     | 0ms     | 0ms     | 0ms     | 0ms     | 0ms     |
| Manual Final Submit (POST)    | 4777ms  | 4823ms  | 4866ms  | 4874ms  | 0ms     | 4882ms  |
| Auto Final Submit (POST)      | 0ms     | 0ms     | 0ms     | 0ms     | 0ms     | 0ms     |
================================================================================
