# Day 4 Dependencies Report

This document details the dependencies, requirements, risks, and design choices to prepare for Day 4 implementation tasks (Autosave, Resume, Submission, and Evaluation triggering).

---

## 1. Autosave Flow

- **Goal**: Automatically save the candidate's answers in real-time to prevent data loss.
- **Dependencies**:
  - Redis cache service must support partial state updates (`patchSessionAnswer`).
  - Frontend must trigger debounced API calls when answers change.
  - Background queue must synchronize Redis states to the PostgreSQL database.
- **Requirements**:
  - Auto-saving must not block UI rendering.
  - Fail-safes: If the network is lost, cache answers locally in `localStorage` and retry when back online.

---

## 2. Resume Flow

- **Goal**: Allow candidates to resume a test session (e.g. after a crash or disconnection) without losing time or progress.
- **Dependencies**:
  - Persistence Layer must return the exact snapshotted states of navigation, timer countdowns, and flagged questions.
  - Expiration checks: If the session has already expired (`currentTime > expiresAt`), block entry.
- **Requirements**:
  - Timer must recalculate correctly on reload based on the saved `expiresAt` timestamp.

---

## 3. Submission Flow

- **Goal**: Lock answers, mark session as complete, and trigger evaluation.
- **Dependencies**:
  - PostgreSQL transaction to update `TestInstanceStatus` to `SUBMITTED`.
  - Queue Service to push a job to the `evaluation` queue.
- **Requirements**:
  - Idempotency: Duplicate submissions must be rejected.
  - Clear feedback on the UI when submission is completed.

---

## 4. Key Risks and Blockers

| Risk                         |  Impact  | Mitigation Strategy                                                                                                           |
| :--------------------------- | :------: | :---------------------------------------------------------------------------------------------------------------------------- |
| **Timer Desynchronization**  |   High   | Always calculate time left on the server side using absolute `expiresAt` timestamps; do not rely on local frontend durations. |
| **Redis Cache Eviction**     | Critical | Set explicit TTL configurations (e.g., 24 hours) to prevent active assessment sessions from being evicted.                    |
| **Database Lock contention** |  Medium  | Use optimized Prisma transactions for auto-saving checkpoints.                                                                |
