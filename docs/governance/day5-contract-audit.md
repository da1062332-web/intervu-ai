# Day 5 Contract & Schema Governance Audit

This governance document audits the code implementation against the official API contract interfaces, Zod validation schemas, and physical Prisma database schemas.

## 1. Schema & Contract Mapping Matrix

| Entity | DB Model | Zod Validation Schema | API Response DTO | Audit Status |
| :--- | :--- | :--- | :--- | :--- |
| **Evaluation Result** | `EvaluationResult` | `ResultResponseSchema` | `ResultResponseDto` | ✅ IN-SYNC |
| **Skill Scores** | `SkillScore` | `SkillScoreSchema` | `SkillScoreDto` | ✅ IN-SYNC |
| **Recommendations** | `Recommendation` | `RecommendationResponseSchema` | `RecommendationResponseDto` | ✅ IN-SYNC |
| **History Pagination**| `EvaluationResult` | `HistoryResponseSchema` | `HistoryResponseDto` | ✅ IN-SYNC |
| **Performance summary**| `EvaluationResult` | `PerformanceSummaryResponseSchema` | `PerformanceSummaryResponseDto` | ✅ IN-SYNC |

---

## 2. Field-Level Contract Alignments

### Results & Skill Scores
* **Prisma schema**: `overallScore`, `confidenceScore`, `technicalScore`, and `communicationScore` are typed as `Float`.
* **Zod / DTO schema**: Defined as numeric values.
* **Audit Result**: Verified mapping via `ResultMapper.toDto`. Stored decimal values from postgres are successfully mapped to JavaScript floating numbers in DTO outputs.

### Recommendations Priority Mapping
* **Prisma Schema**: `priority` is a Prisma Enum `RecommendationPriority` (values: `HIGH`, `MEDIUM`, `LOW`).
* **Zod / DTO Schema**: Enforces enum constraints.
* **Audit Result**: Verified that `RecommendationsService.getRecommendations` handles correct priority sorting and filtering.

### History Pagination & Offset Calculation
* **Prisma Schema**: Fetched via `findMany` using `skip` and `take` variables computed from the request page and limit.
* **Zod / DTO Schema**: Outputs pagination meta fields (`total`, `page`, `limit`, `totalPages`, `hasNext`, `hasPrevious`).
* **Audit Result**: Verified mathematically correct boundary pagination mapping on both single and multiple page lookups.

---

> [!NOTE]
> Database entity model relations use cascade constraints (e.g. deleting an `EvaluationResult` triggers database-level cascades that delete all dependent `SkillScore` and `Recommendation` entries), preserving database clean state contracts.
