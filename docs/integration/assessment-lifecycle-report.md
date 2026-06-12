# Assessment Lifecycle Report

This document details the complete end-to-end lifecycle of assessment questions, tracing their path from raw templates to database snapshots and rendering on the candidate's screen.

---

## 1. Assessment Lifecycle Pipeline

```
  [1. Test Config]
         ↓
  [2. Question Ingestion & Validation]
         ↓ (Validator Score >= 80)
  [3. Question Ingestion into Pool]
         ↓
  [4. Test Assembly Engine] (Anti-repetition check)
         ↓
  [5. Database Transaction Persistence] (PostgreSQL snapshotted)
         ↓
  [6. Candidate Execution UI] (Strips answers, starts timer)
```

---

## 2. Pipeline Phase Details

### Phase 1: Test Config

- A test administrator defines an assessment profile specifying the list of sections, displayName, question counts, and duration seconds.

### Phase 2: Ingestion & Validation

- Questions are generated from template parameters.
- Before ingestion, they run through the **Validation Engine**:
  - Conforms to Zod schemas (Structure).
  - Contains correct answer in options (Answer).
  - Steps counts match difficulty (Difficulty).
  - No unresolved curly braces or missing variables (Ambiguity).
  - Readability and lengths are sufficient (Quality).

### Phase 3: Ingestion into Pool

- Only questions with a validation score $\ge 80$ are persisted in the `GeneratedQuestion` table in PostgreSQL.

### Phase 4: Test Assembly Engine

- When a candidate starts a test, the assembly engine reads the config sections.
- It queries the database pool for questions matching the section's concept and difficulty.
- It orders them and structures them into sections, verifying that no duplicate questions are allocated.

### Phase 5: Database Transaction Persistence

- The assembly output is saved as a `TestInstance` entity.
- A database transaction ensures that `TestInstance`, `TestInstanceSection`, and question snapshotted JSON structures are all saved together or rolled back.

### Phase 6: Candidate Execution UI

- The Execution UI retrieves the `TestInstance` session using the candidate's token.
- Correct answers and solutions are filtered out, and only `CandidateQuestionDto` details are exposed.
- Timer ticks down and navigation palette updates.
