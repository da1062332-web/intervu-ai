# Recommendation Validation & Audit Report (Day 5)

This report audits the Recommendations Engine logic, validating prioritization, skill gap mappings, deduplication constraints, and E2E schema alignment.

## Core Auditing Metrics

### 1. Skill Gap Identification
* **Validation**: The engine successfully evaluates a candidate's answer submissions against expected answers, extracts skill gaps, and maps them to concrete improvements.
* **Database mapping**: Each recommendation stores the specific `skill` category (e.g., `TypeScript`, `Node.js`) that represents the target skill gap.

### 2. Prioritization Logic & Ordering
* **Rules**: Priority is determined based on the score deficit. A large deficit results in a `HIGH` priority, whereas a minor deficit is assigned a `LOW` priority.
* **Sorting Gate**: In the API layer (`RecommendationsService.getRecommendations`), recommendations must always be ordered:
  $$\text{HIGH} \longrightarrow \text{MEDIUM} \longrightarrow \text{LOW}$$
* **Verification Test**: The sorting is verified by sorting a test dataset with random priorities and confirming that index `0` is `HIGH`, index `1` is `MEDIUM`, and index `2` is `LOW`.

### 3. Deduplication and Constraints
* **Duplicate ID Prevention**: The service mapper (`RecommendationMapper.toDtoList`) translates DB models into unique DTO objects. The verification suite validates that no two recommendations in the array share the same `id`.
* **Unique Skill Gap Rules**: For any single assessment, a candidate must receive at most one recommendation per skill gap. The verification suite asserts that the set of skills returned is of size equal to the array length:
  $$\text{size}(\text{Set}(\text{skills})) = \text{length}(\text{recommendations})$$

---

## Audit Matrix

| Metric | Rule | Status | Validation Method |
| :--- | :--- | :--- | :--- |
| **Priority Mapping** | Sort order: HIGH -> MEDIUM -> LOW | ✅ PASS | Checked via `verify-recommendations.ts` sorting assert |
| **Priority Filter** | `getHighPriorityRecommendations` returns only HIGH items | ✅ PASS | Verified count and type output |
| **Deduplication** | No duplicate skills or recommendation IDs per result | ✅ PASS | Evaluated using Unique Set size comparison |
| **Database Cascade**| Deleting evaluation cascades and cleans up recommendations | ✅ PASS | Teardown script successfully cascade deletes recommendations |

---

> [!IMPORTANT]
> The audit confirms that recommendations are correctly linked to evaluations via standard DB foreign keys (`evaluationId` referencing `EvaluationResult.id` with `onDelete: Cascade`). No orphaned recommendations are left in the database.
