# Migration & Schema Audit Report (Phase 1)

## OVERALL STATUS: ❌ BLOCKED

### Task A: Schema Audit

**Objective**: Compare actual `schema.prisma` vs Expected Day 1-5 Architecture.
**Result**: **FAIL**

**Gap Report**:

- Expected Model `GeneratedQuestion` -> **MISSING**
- Expected Model `TestInstance` -> **MISSING** (Using `Test` instead)
- Expected Model `Section` -> **MISSING**
- Expected Model `Question` -> **MISSING**
- Expected Model `Evaluation` -> **MISSING** (Using `EvaluationResult` instead)
- Expected Model `Recommendation` -> **MISSING**

_Conclusion_: The current schema does not match the architectural expectations. We cannot proceed to launch with raw JSON fields replacing relational models.

### Task B: Migration History Audit

**Objective**: Verify existing migrations.
**Result**: **FAIL**

**Current Migrations**:

1. `20260529110602_` (Unnamed)
2. `20260601102905_link_session_refreshtoken`
3. `20260606042500_init_evaluation_persistence`

_Conclusion_: The migrations applied so far do not encompass the full required schema.

### Task C: Relationship Audit

**Objective**: Verify relationships between expected models.
**Result**: **FAIL**

**Gap Report**:

- `Template -> GeneratedQuestion`: Broken (GeneratedQuestion does not exist).
- `TestInstance -> Section -> Question`: Broken (None of these exist).
- `Evaluation -> Recommendation`: Broken (Recommendation does not exist).
- Only `User -> Session` and `User -> RefreshToken` are fully sound.

### Task D & E: Index & Constraint Audit

**Objective**: Verify indexes and constraints for existing models.
**Result**: **PASS (Partial)**

**Findings**:

- `User` has `@@index([deletedAt])` and `@@index([role])`.
- `Session` has `@@index([userId])` and `Cascade` delete.
- `Test` has `@@index([userId])` and `@@index([templateId])`.
- `EvaluationResult` has `@@index([userId])` and `@@index([testId])`.
- Existing models have correct `Cascade` or `Restrict` constraints.
- _However_, we cannot verify indexes/constraints for the missing models.

### Task F: Automation Scripts

- `scripts/verify-migrations.ts` has been created successfully.

---

## Final Verdict

**BLOCKED**. Schema Remediation is required before we can certify the backend for MVP Launch.
