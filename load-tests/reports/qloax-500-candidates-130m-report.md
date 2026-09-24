
================================================================================
# Qloax Assessment Load Test Report: 500 Candidates (130-Minute Complete Exam)
================================================================================
Generated:              2026-09-24T09:31:37.669Z
Target Environment:     https://skillitrix.onrender.com/api/v1
Assessment ID:          cmsifafam000099s9csfe33pg
Test Run Identifier:    run-qloax-500cand-mufc1hkz
Virtual Users (VUs):    500 Candidates
Configured Duration:    7800s (~130.0 minutes)
Candidate Ramp Window:  300s

--------------------------------------------------------------------------------
## 1. Executive Throughput & Error Summary
- Total HTTP Requests:             96083
- Throughput (RPS):                11.79 req/s
- Overall Error Rate:              3.29%
- Candidates Registered:           175 / 500
- Assessments Started:             175 / 500
- Answers Autosaved:               58451
- Answers Modified (Review):       11536
- Telemetry Heartbeats:            31979
- Section Transitions:             700

--------------------------------------------------------------------------------
## 2. Coding Section Performance (Compile & Execution)
- Code Runs Executed (Public):     1050
- Code Submissions (Full Suite):   525
- Capacity Rejections (HTTP 503):  0
- Execution Errors:                1050
- Coding Run Latency (p95):        461ms (Avg: 201ms)
- Coding Submit Latency (p95):     7932ms (Avg: 4693ms)

--------------------------------------------------------------------------------
## 3. Final Minute Submissions Breakdown
- Manual Submissions (Early):      85
- Automatic Submissions (Timeout): 55
- Failed Submissions:              35
- Duplicate Submissions Blocked:   174
- Manual Submit Latency (p95):     12879ms (Avg: 4745ms)
- Auto Submit Latency (p95):       11069ms (Avg: 4731ms)

--------------------------------------------------------------------------------
## 4. Data Integrity & Verification
- State Integrity Verified:        175
- Data Mismatches / Lost Answers:  0

--------------------------------------------------------------------------------
## 5. Comprehensive Latency Distribution Table
| Endpoint / Action             | Avg     | Med     | p90     | p95     | p99     | Max     |
|-------------------------------|---------|---------|---------|---------|---------|---------|
| Start Assessment (POST)       | 15213ms | 14678ms | 19821ms | 20519ms | 0ms     | 22639ms |
| Snapshot Manifest Load (GET)  | 6524ms  | 5724ms  | 9548ms  | 16597ms | 0ms     | 18212ms |
| Answer Autosave (POST)        | 707ms   | 491ms   | 1034ms  | 1411ms  | 0ms     | 60001ms |
| Section Advancement (POST)    | 3405ms  | 2866ms  | 3796ms  | 7169ms  | 0ms     | 28426ms |
| Telemetry Heartbeat (POST)    | 465ms   | 440ms   | 603ms   | 912ms   | 0ms     | 60001ms |
| Coding Public Run (POST)      | 201ms   | 128ms   | 444ms   | 461ms   | 0ms     | 3361ms  |
| Coding Full Submit (POST)     | 4693ms  | 6906ms  | 7727ms  | 7932ms  | 0ms     | 8606ms  |
| Manual Final Submit (POST)    | 4745ms  | 4816ms  | 9388ms  | 12879ms | 0ms     | 15699ms |
| Auto Final Submit (POST)      | 4731ms  | 4633ms  | 7873ms  | 11069ms | 0ms     | 13341ms |
================================================================================
