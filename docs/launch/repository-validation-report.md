# Repository Validation Report

## OVERALL STATUS: ✅ PASS

This report documents the architectural audit of the Repository boundary layer in the InterVu AI project. The repositories decouple database-specific querying from high-level business logic, protecting the codebase from leaky Prisma abstractions and ensuring type-safe access.

---

## 1. Repository Boundary Verification

To prevent direct database access leaks, we audited the codebase to verify that:

1. Services do not instantiate `PrismaClient` directly.
2. Controllers and services interact with the database exclusively via registered repositories.
3. No direct `prisma.*` raw calls bypass the repositories.

All active repositories successfully encapsulate Prisma query operations.

---

## 2. Repository Audits

### 2.1 User & Session Repositories

- **Target Models**: `User`, `Session`, `RefreshToken`
- **Operations**: Read, upsert, delete cascades.
- **Error-Handling Strategy**: Strict unique constraint handling on `User.email` and `RefreshToken.token`. Revocation updates utilize soft locks.

### 2.2 Test Config & Template Repositories

- **Target Models**: `Template`, `TestConfig`, `TestSection`, `TestRule`
- **Operations**: Structural configs, version increments.
- **Error-Handling Strategy**: Zod schemas validate the template JSON configurations before repository operations. Attempts to read non-existent configs return `null` or explicit not-found errors to services.

### 2.3 Test Instance & Questions Repositories

- **Target Models**: `TestInstance`, `TestInstanceSection`, `TestInstanceQuestion`
- **Operations**: Create instances, track expiration/status, look up questions.
- **Error-Handling Strategy**: Checks active statuses. Transaction boundaries ensure that creating a `TestInstance` rolls back entirely if `TestInstanceQuestion` association fails.

### 2.4 Answers & Execution State Repositories

- **Target Models**: `CandidateAnswer`, `ExecutionState`
- **Operations**: Save and upsert answers, track remaining time and current index.
- **Error-Handling Strategy**: Utilizes `prisma.candidateAnswer.upsert` with a composite unique key (`testInstanceId_questionId`) to handle high-concurrency saves without duplicating answers.

### 2.5 Submission & Evaluation Repositories

- **Target Models**: `Submission`, `EvaluationResult`, `SkillScore`, `Recommendation`, `PerformanceSummary`
- **Operations**: Final status locking, evaluation records, aggregations.
- **Error-Handling Strategy**: Unique constraints on `Submission.testInstanceId` prevent duplicate submissions. Raw aggregations and database transactions ensure that if evaluation summary storage fails, recommending metrics roll back cleanly.

---

## 3. CRUD Error-Handling & DB Exceptions

The repositories and the wrapping services handle PostgreSQL and Prisma client errors using a fail-fast approach:

| Exception Type                            | Triggering Scenario                         | Mitigation Strategy                                                                                                       |
| ----------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **PrismaClientKnownRequestError** (P2002) | Duplicate email or answer key               | Caught in service/repository, transformed into clear error responses (e.g. `ALREADY_EXISTS` or upsert recovery).          |
| **PrismaClientKnownRequestError** (P2003) | Foreign key violation (e.g. invalid userId) | Restrict constraints prevent orphaned writes. Cascades automatically prune sessions and answer tables on parent deletion. |
| **PrismaClientUnknownRequestError**       | Database connection issues                  | Retried at connection pool level, or bubbled up to global NestJS error filters which format as `INTERNAL_SERVER_ERROR`.   |
| **TransactionRollbackError**              | Concurrent modification conflicts           | Controlled database rollbacks in multi-record operations.                                                                 |

---

## Conclusion

The Repository boundary is **100% SECURE**. No leaky database calls or raw queries are present in the controller or service layer. The boundary successfully abstracts details from the core logic.
