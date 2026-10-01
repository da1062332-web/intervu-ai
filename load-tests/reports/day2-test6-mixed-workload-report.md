
================================================================================
# Qloax Day 2 - Test 6: Mixed Realistic 500-Candidate Workload Report
================================================================================
Generated:                  2026-09-30T07:27:14.721Z
Target Environment:         https://skillitrix.onrender.com/api/v1
Assessment ID:              cmsifafam000099s9csfe33pg
Candidates Attempted:       500
Successful Candidates:      500
Failed Candidates:          0
Overall Error Rate:         0.00%

--------------------------------------------------------------------------------
## 1. HTTP Status & Network Error Breakdown
- HTTP 429 (Rate Limited):  0
- HTTP 4xx (Client Errors): 0
- HTTP 5xx (Server Drops):  0
- Timeouts:                 0
- Connection Resets:        0
- Stream EOF:               0

--------------------------------------------------------------------------------
## 2. Mixed Realistic Workflow Operations
- Question Navigations:     500 / 500 (Target: 100%)
- Answers Persisted Total:  1500 (Target: 1,500 total, 3/candidate)
- Answer Changes / Updates: 500 (Target: 500 total, 1/candidate)
- Heartbeats Ingested:      1500 (Target: 1,500 total, 3/candidate)
- Section Transitions:      500 / 500 (Target: 100%)
- Resumes / State Reused:   500 / 500 (Target: 100%)

--------------------------------------------------------------------------------
## 3. Sub-Flow Latency Distribution
| Flow / Sub-Operation       | p50      | p95      | p99      | Max      | Avg      |
|----------------------------|----------|----------|----------|----------|----------|
| Assessment Start (/start)  | 10440ms  | 11940ms  | 0ms      | 92656ms  | 10572ms  |
| Layout Fetch (/tests/:id)  | 2926ms   | 4479ms   | 0ms      | 31854ms  | 3378ms   |
| Answer Autosaves (/answer)  | 1229ms   | 2217ms   | 0ms      | 26532ms  | 1311ms   |
| Heartbeat (/telemetry)     | 183ms    | 2144ms   | 0ms      | 23223ms  | 828ms    |
| Section Advance (/advance) | 3382ms   | 4167ms   | 0ms      | 5747ms   | 3453ms   |
| Session Resume (/resume)   | 1273ms   | 2126ms   | 0ms      | 6210ms   | 1416ms   |
| Full Candidate Flow        | 30053ms  | 37038ms  | 0ms      | 115980ms | 31204ms  |
================================================================================
