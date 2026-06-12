# Day 4 Integration Matrix

This document defines the interface and data flow boundary for all Day 4 components of the Assessment Lifecycle MVP (Validation, Persistence, Recovery UX, Execution APIs, and Evaluation).

---

## 1. System Flow & Data Contracts

| Component | Owner | Input Interface | Output Interface / Side Effect |
| :--- | :--- | :--- | :--- |
| **Evaluation Engine** | Dev 1 (AI Engineer) | `ExecutionResultDto`<br>(Candidate Answers + Timestamps) | `EvaluationResultDto`<br>(Overall score, skill scores, feedback highlights) |
| **Persistence Layer** | Dev 2 (Backend / DB) | Answer values + Remaining time + Question Order index | Flat transaction DB upsert (`CandidateAnswer` & `ExecutionState`) |
| **Recovery UX** | Dev 3 (Frontend UX) | `TestInstance` + `ExecutionState` | Restored navigation bounds, countdown timers, and input states |
| **Execution APIs** | Dev 4 (API REST Gate) | HTTP payload actions (`POST /answer`, `POST /submit`) | Execution events, auto-submit trigger, and database locks |

---

## 2. Component Integration Details

### A. Evaluation Engine
- **Assembly Trigger**: Invoked asynchronously outside the main database transaction upon successful test submission to protect database connection pools from slow analytics queries.
- **DTO validation**: Under the hood, strict input/output Zod verification checks are performed to detect any data model drifts early.

### B. Persistence Layer
- **Auto-saving Checkpoints**: Performs a single network round-trip upsert query in a database transaction to lock both answers and progress metadata in the SQL tables simultaneously.
- **Bulk Sync**: Employs raw parameterized SQL updates to support rapid candidate synchronization during offline recovery.

### C. Recovery UX
- **Session Restoration**: When a candidate enters the dashboard and clicks **"Resume Assessment"**, the frontend fetches the database snapshot, matches it against local stores, and renders the exact progress index and timer bounds with zero state desynchronization.

### D. Execution APIs
- **Submission Lock**: Any modifications to answers are blocked once the status is updated to `SUBMITTED`. The API returns `ANSWER_MODIFICATION_NOT_ALLOWED` for all incoming modifications.
