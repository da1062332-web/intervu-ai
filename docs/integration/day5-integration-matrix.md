# Day 5 - Business Value Flow Integration Matrix

This document defines the interface specifications, data structures, and module ownership for the end-to-end (E2E) flow from Assessment completion through Evaluation, Recommendations generation, Results presentation, and history tracking.

## Module Ownership & Responsibility

| Feature / Phase | Source Module | target Module / Consumer | Primary Owner | Security Gate / Authorization |
| :--- | :--- | :--- | :--- | :--- |
| **Assessment Completion** | `ExecutionModule` | Database / `EvaluationModule` | AI+Full-Stack Integrator | Verifies submission status is `COMPLETED` |
| **Evaluation Calculations** | `EvaluationModule` | `ResultsModule` | AI+Full-Stack Integrator | Computes overall/technical/communication scores |
| **Recommendations Engine** | `EvaluationModule` | `ResultsModule` | AI Stack Engineer | Priority mapping (HIGH -> LOW) and skill gap tags |
| **Results Presentation** | `ResultsModule` | Frontend (Dashboard) | Frontend/Full-Stack | Session verification + user ownership checks |
| **Dashboard Insights** | `ResultsModule` | Frontend (Metrics UI) | Full-Stack | Aggregated counts, averages, and latest timestamps |
| **Assessment History** | `ResultsModule` | Frontend (History List) | Full-Stack | Paginated query mapping templates & test history |

---

## Interface Specifications & Contracts

### 1. Results Retrieval Interface (`ResultsService.getResultDetails`)
* **Inputs**:
  - `userId` (String) - ID of the candidate requestor.
  - `evaluationId` (String) - ID of the evaluation result to retrieve.
* **Outputs** (`ResultResponseDto`):
  - `id`: String (cuid)
  - `userId`: String
  - `testId`: String (cuid)
  - `overallScore`: Float (0-100)
  - `confidenceScore`: Float (0-100)
  - `communicationScore`: Float (0-100)
  - `technicalScore`: Float (0-100)
  - `overallRating`: Float (0-5)
  - `notes`: String | null
  - `totalQuestions`: Int
  - `correctAnswers`: Int
  - `incorrectAnswers`: Int
  - `evaluatedAt`: Date/ISOString
  - `skillScores`: Array of `SkillScoreDto`
    - `id`: String
    - `skill`: String
    - `score`: Float
    - `feedback`: String

### 2. Recommendations Interface (`RecommendationsService.getRecommendations`)
* **Inputs**:
  - `userId` (String)
  - `evaluationId` (String)
* **Outputs** (`RecommendationResponseDto[]`):
  - `id`: String (cuid)
  - `evaluationId`: String
  - `skill`: String
  - `priority`: `HIGH` | `MEDIUM` | `LOW`
  - `title`: String
  - `description`: String
  - `createdAt`: Date/ISOString

### 3. Assessment History Interface (`PerformanceService.getHistory`)
* **Inputs**:
  - `userId` (String)
  - `paginationDto` (`PaginationDto`):
    - `page`: Integer (default 1)
    - `limit`: Integer (default 10)
* **Outputs** (`HistoryResponseDto`):
  - `items`: Array of `HistoryItemResponseDto`
    - `evaluationId`: String
    - `testId`: String
    - `testInstanceId`: String | null
    - `overallScore`: Float
    - `evaluatedAt`: Date/ISOString
  - `total`: Int
  - `page`: Int
  - `limit`: Int
  - `totalPages`: Int
  - `hasNext`: Boolean
  - `hasPrevious`: Boolean

### 4. Dashboard Insights Interface (`PerformanceService.getPerformanceSummary`)
* **Inputs**:
  - `userId` (String)
* **Outputs** (`PerformanceSummaryResponseDto`):
  - `testsCompleted`: Int
  - `averageScore`: Float
  - `bestScore`: Float
  - `lastAssessmentDate`: Date/ISOString | null

---

> [!NOTE]
> All APIs enforce strict context isolation and tenant security bounds. E.g., invoking results or recommendations for an evaluation that is owned by a different candidate ID results in `UnauthorizedResultAccessError`.

> [!IMPORTANT]
> The database schemas match the interfaces 1:1, enabling transparent mappings. Entity DTO conversions are encapsulated inside single-responsibility mappers (`ResultMapper`, `RecommendationMapper`, `HistoryMapper`, `PerformanceMapper`).
