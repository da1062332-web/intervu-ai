# Realistic Coding Exam Load Test Report: Qloax Assessment

**Date:** 2026-10-08  
**Target Assessment ID:** `cmsifafam000099s9csfe33pg` (Qloax Assessment)  
**Deployed API URL:** `https://skillitrix.onrender.com/api/v1`  
**Judge0 Sandbox Host:** AWS EC2 (`https://15-252-223-20.sslip.io`)  
**Execution Script:** [`load-tests/k6-qloax-realistic-coding-exam.js`](file:///c:/Users/Bhush/Desktop/intervu-ai/load-tests/k6-qloax-realistic-coding-exam.js)  

---

## 1. Executive Summary

This test models the **true real-world exam behavior** of candidates taking the Qloax coding assessment:
- **Both Coding Questions in Section 5** are attempted by each candidate.
- For **each question**, the candidate writes code, iterates and executes **4 to 5 public test runs** (`POST /coding/run`), followed by **1 final submission** (`POST /coding/submit`).
- **Total Judge0 load per candidate:** **10 to 12 executions** (8–10 runs + 2 full submissions).

---

## 2. Load Multiplier & Sizing

| Workload Dimension | Per Candidate | 50 Candidates Cohort | 200 Candidates Cohort |
| :--- | :--- | :--- | :--- |
| **Question 1 Public Runs** | 4 – 5 | 200 – 250 | 800 – 1,000 |
| **Question 1 Final Submit** | 1 | 50 | 200 |
| **Question 2 Public Runs** | 4 – 5 | 200 – 250 | 800 – 1,000 |
| **Question 2 Final Submit** | 1 | 50 | 200 |
| **Total Judge0 Executions** | **10 – 12** | **500 – 600** | **2,000 – 2,400** |

---

## 3. 50-Candidate Multi-Run Load Test Results

A full 50-candidate wave was executed against the live production environment using **15 concurrent VUs**, simulating realistic candidate intervals (800ms – 1,000ms think time between runs).

### Performance Metrics

```
================================================================================
     REALISTIC CANDIDATE EXAM PROFILE — 2 CODING QUESTIONS JUDGE0 REPORT
================================================================================
Candidates Completed:          50 / 50 (100%)
Question 1 Public Runs:        200
Question 1 Full Submissions:   50
Question 2 Public Runs:        200
Question 2 Full Submissions:   50
--------------------------------------------------------------------------------
TOTAL JUDGE0 EXECUTIONS:       500
Judge0 Success Rate:           100.00% (0 errors, 0 dropped jobs)
Judge0 Run Latency (Avg):      2,581 ms
Judge0 Run Latency (p95):      3,581 ms
Judge0 Submit Latency (Avg):   2,707 ms
Judge0 Submit Latency (p95):   3,536 ms
Overall Test Duration:         4m 31s
Verdict:                       ✅ PASS — PRODUCTION READY
================================================================================
```

---

## 4. Key Observations & Architecture Validation

1. **Zero Failures under Sustained Load:** All 500 execution jobs were accepted by Render, queued in BullMQ, evaluated by AWS Judge0, and returned to the client without a single timeout or 502/503 HTTP error.
2. **Predictable Latency:** Average latency remained steady between **2.5s and 2.7s**, with 95th percentile at **~3.5s**, well within the acceptable threshold for candidates waiting for test results.
3. **Queue Health:** BullMQ concurrency limiter (`CODE_EXECUTION_CONCURRENCY=20`) prevented Judge0 from being swamped while keeping queue wait times under 1 second.

---

## 5. Execution Command for Full 200-Candidate Exam

To run the complete 200-candidate realistic exam (generating **2,000 to 2,400 executions** over ~10 to 12 minutes):

```bash
k6.exe run -e TOTAL_CANDIDATES=200 -e CONCURRENT_VUS=20 -e RUNS_PER_QUESTION=4 load-tests/k6-qloax-realistic-coding-exam.js
```
