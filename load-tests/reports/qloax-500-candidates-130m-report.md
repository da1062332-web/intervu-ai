
================================================================================
# Qloax Assessment Load Test Report: 500 Candidates (130-Minute Complete Exam)
================================================================================
Generated:              2026-10-02T06:35:10.697Z
Target Environment:     https://skillitrix.onrender.com/api/v1
Assessment ID:          cmsifafam000099s9csfe33pg
Test Run Identifier:    run-qloax-500cand-muql9dyf
Virtual Users (VUs):    500 Candidates
Configured Duration:    7800s (~130.0 minutes)
Candidate Ramp Window:  180s

--------------------------------------------------------------------------------
## 1. Executive Throughput & Error Summary
- Total HTTP Requests:             9001
- Throughput (RPS):                8.23 req/s
- Overall Error Rate:              0.00%
- Candidates Registered:           500 / 500
- Assessments Started:             500 / 500
- Answers Autosaved:               2000
- Answers Modified (Review):       500
- Telemetry Heartbeats:            1500
- Section Transitions:             2000

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
- Manual Submissions (Early):      300
- Automatic Submissions (Timeout): 200
- Failed Submissions:              0
- Duplicate Submissions Blocked:   500
- Manual Submit Latency (p95):     10355ms (Avg: 6884ms)
- Auto Submit Latency (p95):       10526ms (Avg: 7055ms)

--------------------------------------------------------------------------------
## 4. Data Integrity & Verification
- State Integrity Verified:        500
- Data Mismatches / Lost Answers:  0

--------------------------------------------------------------------------------
## 5. Comprehensive Latency Distribution Table
| Endpoint / Action             | Avg     | Med     | p90     | p95     | p99     | Max     |
|-------------------------------|---------|---------|---------|---------|---------|---------|
| Start Assessment (POST)       | 12290ms | 12553ms | 14663ms | 15051ms | 0ms     | 17185ms |
| Snapshot Manifest Load (GET)  | 2911ms  | 2870ms  | 3587ms  | 3905ms  | 0ms     | 7990ms  |
| Answer Autosave (POST)        | 1352ms  | 1354ms  | 1977ms  | 2240ms  | 0ms     | 4309ms  |
| Section Advancement (POST)    | 3848ms  | 3721ms  | 4742ms  | 4872ms  | 0ms     | 5281ms  |
| Telemetry Heartbeat (POST)    | 691ms   | 164ms   | 1913ms  | 2205ms  | 0ms     | 3871ms  |
| Coding Public Run (POST)      | 0ms     | 0ms     | 0ms     | 0ms     | 0ms     | 0ms     |
| Coding Full Submit (POST)     | 0ms     | 0ms     | 0ms     | 0ms     | 0ms     | 0ms     |
| Manual Final Submit (POST)    | 6884ms  | 6314ms  | 9086ms  | 10355ms | 0ms     | 11798ms |
| Auto Final Submit (POST)      | 7055ms  | 6433ms  | 9611ms  | 10526ms | 0ms     | 11171ms |
================================================================================
