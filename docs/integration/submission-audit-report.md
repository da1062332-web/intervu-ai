# Submission Audit Report

This audit report documents compliance checks for submission processing to guarantee assessment integrity.

---

## 1. Submission Integrity Metrics

### A. Submission & Evaluation Alignment

- Every completed assessment instance creates exactly **one** record in the `Submission` table and **one** record in the `EvaluationResult` table upon completion.
- Evaluated statuses link directly to active submissions (`status = EVALUATED`).

### B. Duplicate Submission Prevention

- The database enforces a `UNIQUE` constraint on `testInstanceId` in the `Submission` table.
- Concurrent or duplicate calls to `POST /tests/:id/submit` are rejected at the service level, returning a `409 Conflict` (or standard error envelope) if the submission already exists.

### C. Answer Lock Enforcement (Submission Lock)

- Once the submission status is set to `SUBMITTED`, all answer update requests are blocked.
- Any attempt to write to `POST /tests/:id/answer` for a locked test returns an error:
  `ANSWER_MODIFICATION_NOT_ALLOWED`

---

## 2. Audit Checklist

| Check                   | Expected Behavior                             | Status   |
| :---------------------- | :-------------------------------------------- | :------- |
| **Unique Submission**   | One submission record per test instance       | **PASS** |
| **Double Submit Block** | Rejects subsequent submit HTTP requests       | **PASS** |
| **Lock Enforcement**    | Rejects answer modifications after submission | **PASS** |
| **Evaluation Sync**     | Starts evaluation processing on submit        | **PASS** |
