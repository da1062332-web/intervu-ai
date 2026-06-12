# Day 5 Dependencies Report

This document outlines the dependencies, requirements, database schemas, and risks for the Day 5 sprint (Results, Recommendations, Dashboard Analytics, and Attempt History).

---

## 1. Day 5 Requirements & Inputs

### A. Results & Attempt History

- **Goal**: Enable candidates and administrators to review completed test results.
- **Inputs**:
  - `TestInstance` (with status = `SUBMITTED` or `COMPLETED`).
  - `Submission` and `EvaluationResult` tables must be fully populated and joined.
- **Database Dependency**:
  - Need highly optimized queries to load sections, question snapshots, candidate answers, and AI feedback.

### B. Recommendations Engine

- **Goal**: Suggest relevant study materials, technical topics, and next steps based on candidate performance.
- **Inputs**:
  - `skillScores` from the evaluation result.
  - Core mapping data linking weak concepts (score < 70) to recommendation templates.

### C. Dashboard Analytics

- **Goal**: Render admin and candidate stats charts (e.g. average score, completion rates, strength/weakness charts).
- **Inputs**:
  - Aggregated evaluation metrics across all candidate submissions.

---

## 2. Key Risks & Mitigation

| Risk                            | Impact | Mitigation Strategy                                                                                                                    |
| :------------------------------ | :----- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **Slow Analytics Queries**      | Medium | Compute and persist analytics aggregates in an asynchronous worker job instead of querying raw transaction history on every page view. |
| **Recommendation Engine Drift** | Medium | Ensure concept keys mapped in templates match those saved in generated questions.                                                      |
