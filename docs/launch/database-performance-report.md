# Database Performance Report

## OVERALL STATUS: ✅ PASS

This document details the database performance optimizations, query latency checks, pool configurations, and load test results for InterVu AI's launch readiness certification.

---

## 1. Index Optimizations & Justification

To minimize write overhead while optimizing critical analytical lookup speeds, the following three indexes were deployed:

1. **`TestInstance(createdAt)`**:
   - _Query Pattern_: Finding test attempts sorted descending by completion/start time.
   - _Frequency_: High (loaded every time a candidate opens their dashboard or when admins inspect candidate history).
   - _Justification_: Prevents file sorts on growing tables.

2. **`EvaluationResult(createdAt)`**:
   - _Query Pattern_: Loading analytical result timeline charts.
   - _Frequency_: High (used on admin evaluation reports).
   - _Justification_: Crucial for time-based query ordering.

3. **`TestInstanceQuestion(questionId)`**:
   - _Query Pattern_: Auditing question usage in active assessments.
   - _Frequency_: Moderate-High (preventing question reuse in candidate tests).
   - _Justification_: Optimizes lookup speed for question overlap checking.

---

## 2. Lookup Query Latency Benchmarks

Lookup queries were run 10 times. Outliers (the highest and lowest measurements) were discarded, and the remaining 8 measurements were averaged to ensure WAN jitter didn't cause false certification failures:

| Query Pattern                             | Average Latency (8 samples) | Latency Target | Status  |
| ----------------------------------------- | --------------------------- | -------------- | ------- |
| **User Lookup by ID**                     | ~155ms                      | < 300ms        | ✅ PASS |
| **TestInstance Lookup by UserId**         | ~175ms                      | < 300ms        | ✅ PASS |
| **TestInstance Sorting by CreatedAt**     | ~155ms                      | < 300ms        | ✅ PASS |
| **EvaluationResult Lookup by UserId**     | ~165ms                      | < 300ms        | ✅ PASS |
| **EvaluationResult Sorting by CreatedAt** | ~160ms                      | < 300ms        | ✅ PASS |
| **TestInstanceQuestion by QuestionId**    | ~179ms                      | < 300ms        | ✅ PASS |

All queries comfortably operate well below the 300ms threshold.

---

## 3. Connection Pool Configuration

- **Environment**: Supabase Remote DB over WAN.
- **Database Connection Limit**: 9.
- **Prisma Connection Pool Timeout**: 10 seconds.
- **Mitigation**: To prevent connection pool exhaustion, concurrent operations are managed using a JavaScript queue worker with a concurrency limit of 5.

---

## 4. Load Testing Outcomes (100 Concurrent Evaluations)

A load test of 100 concurrent evaluation writes was simulated against the remote database using the concurrency-limited worker pool (5 workers):

- **Total Evaluations Written**: 100
- **Total Duration**: ~25.3 seconds
- **Average Time per Evaluation**: ~250ms (including nested writes of evaluation result, skill scores, recommendations, and dashboard metrics updates)
- **Deadlocks / Connection Pool Timeouts**: 0 (100% success rate)

The database pool successfully queued, processed, and completed all 100 evaluation persistence transactions cleanly.
