# TCS Hiring Qualification Evaluation System - Implementation Report

## Overview
The **Generic Hiring Evaluation Framework** expands the InterVU AI assessment platform with a scalable, strategy-driven corporate qualification evaluation engine. While fulfilling the **TCS Hiring Qualification Evaluation** requirements (classifying candidates into **`NOT_QUALIFIED`**, **`NINJA`**, **`DIGITAL`**, and **`PRIME`**), the architecture uses a **Strategy Pattern** to support future corporate hiring rulesets (such as **Infosys**, **Accenture**, **Capgemini**, **Cognizant**, or **Custom**) without code changes to the core evaluation engine.

---

## 1. System Architecture

```
                                    +------------------------------+
                                    |    ResultGeneratorService    |
                                    +--------------+---------------+
                                                   |
                                                   v
                                    +------------------------------+
                                    |    HiringEvaluationEngine    |
                                    +--------------+---------------+
                                                   |
                                                   v
                                    +------------------------------+
                                    |    HiringStrategyRegistry    |
                                    +--------------+---------------+
                                                   |
                                   +---------------+---------------+
                                   |                               |
                                   v                               v
                       +-----------------------+       +-----------------------+
                       |   TcsHiringStrategy   |       | InfosysHiringStrategy |
                       +-----------------------+       +-----------------------+
```

- **`HiringEvaluationEngine`**: Core service orchestrating candidate qualification evaluation. It retrieves the configured strategy for an assessment, loads relational section mappings and cutoffs, and delegates execution to the appropriate strategy instance.
- **`IHiringEvaluationStrategy`**: Standard TypeScript interface defining `evaluate(context: HiringEvaluationContext): Promise<HiringEvaluationResultDto>`.
- **`TcsHiringStrategy`**: Implements the 5-step TCS qualification algorithm with foundation sectional cutoffs, Foundation Total thresholds, Advanced Aptitude score cutoffs, and coding problem status checks.
- **`HiringStrategyRegistry`**: Dynamic lookup registry mapping strategy codes (`TCS`, `INFOSYS`, `ACCENTURE`, etc.) to strategy implementations.

---

## 2. Database Changes

### Relational Schema Additions (`packages/database/prisma/schema.prisma`)

1. **`HiringEvaluationConfig`**:
   - `id`: Primary key (cuid)
   - `examConfigId`: Unique foreign key to `ExamConfig`
   - `strategy`: Enum (`TCS`, `INFOSYS`, `ACCENTURE`, `CAPGEMINI`, `COGNIZANT`, `CUSTOM`)
   - `enabled`: Boolean toggle
   - `ninjaThreshold`: Minimum total correct answers in Foundation sections for Ninja tier
   - `digitalThreshold`: Minimum total correct answers in Foundation sections for Digital tier
   - `primeThreshold`: Minimum total correct answers in Foundation sections for Prime tier
   - `advancedDigitalMin`: Minimum correct answers in Advanced Aptitude for Digital tier
   - `advancedPrimeMin`: Minimum correct answers in Advanced Aptitude for Prime tier
   - `codingTotalProblems`: Total coding problem count
   - `codingDigitalMinSolved`: Minimum coding problems fully solved for Digital tier
   - `codingPrimeMinSolved`: Minimum coding problems fully solved for Prime tier

2. **`HiringSectionMapping`**:
   - `id`: Primary key (cuid)
   - `configId`: Foreign key to `HiringEvaluationConfig`
   - `sectionCode`: Section identifier (relates to `ExamSection`)
   - `sectionName`: Display name of the section
   - `mappingType`: Enum (`NUMERICAL`, `VERBAL`, `REASONING`, `ADVANCED_APTITUDE`, `CODING`)
   - `minimumCorrectAnswers`: Sectional cutoff required to qualify

3. **`CandidateResult` Model Extensions**:
   - `evaluationStrategy`: Strategy code executed (e.g. `"TCS"`)
   - `strategyVersion`: Strategy version number (`1`)
   - `qualification`: Qualification tier outcome (`"NOT_QUALIFIED"`, `"NINJA"`, `"DIGITAL"`, `"PRIME"`)
   - `qualificationReason`: Human-readable reason explanation
   - `foundationScore`: Total correct answers across Foundation sections
   - `advancedScore`: Total correct answers in Advanced Aptitude section
   - `codingSolved`: Count of fully solved (`SOLVED`) coding problems
   - `qualificationDetails`: Complete JSON breakdown object
   - `evaluatedAt`: Evaluation timestamp

---

## 3. Evaluation Algorithm (TCS Strategy)

- **Step 1: Sectional Cutoff Checks**
  - Evaluate all sections mapped to `NUMERICAL`, `VERBAL`, and `REASONING`.
  - If any mapped section has `correctCount < minimumCorrectAnswers`:
    - Return `NOT_QUALIFIED`
    - Reason: `"Sectional cutoff not cleared"`
    - Stop evaluation.

- **Step 2: Foundation Total Check**
  - Calculate `Foundation Total` = Numerical Correct + Verbal Correct + Reasoning Correct.
  - If `Foundation Total < ninjaThreshold`:
    - Return `NOT_QUALIFIED`
    - Reason: `"Foundation cutoff not cleared"`
    - Stop evaluation.

- **Step 3: Ninja Qualification**
  - If `Foundation Total >= ninjaThreshold`, candidate qualifies for at least `NINJA`.

- **Step 4 & 5: Digital & Prime Qualification Checks**
  - If `Foundation Total >= digitalThreshold`:
    - Evaluate `Advanced Aptitude` correct count.
    - Evaluate Coding problems: calculate problem status (`SOLVED` if score >= 100%, `PARTIAL` if score > 0%, `FAILED` if score == 0). Count problems with status `SOLVED`.

  - **Prime Rule**:
    - `Foundation Total >= primeThreshold` AND `Advanced Score >= advancedPrimeMin` AND `codingSolved >= codingPrimeMinSolved`
    - If satisfied -> Return `PRIME`

  - **Digital Rule**:
    - `Foundation Total >= digitalThreshold` AND `Advanced Score >= advancedDigitalMin` AND `codingSolved >= codingDigitalMinSolved`
    - If satisfied -> Return `DIGITAL`

  - **Fallback**:
    - Return `NINJA`.

---

## 4. API Endpoints

- **GET `/admin/configs/:id/hiring-evaluation`**:
  Fetches the hiring configuration and relational section mappings for an assessment.
- **PATCH `/admin/configs/:id/hiring-evaluation`**:
  Creates or updates hiring configuration and section mappings for an assessment.
- **GET `/results/:id` & `/results/candidate/:id`**:
  Returns extended `CandidateResultDto` including qualification status, reason, foundation breakdown, advanced breakdown, and coding breakdown.
- **GET `/admin/reports/candidates`**:
  Allows filtering candidate reports by `qualification` (`NOT_QUALIFIED`, `NINJA`, `DIGITAL`, `PRIME`) and `strategy`.
- **GET `/admin/reports/qualification-stats`**:
  Returns candidate count per qualification tier and overall qualification percentage.
- **GET `/admin/reports/exports/candidates`**:
  Exports candidate reports as CSV with Strategy, Qualification, Reason, Foundation Score, Advanced Score, and Coding Solved columns.

---

## 5. Frontend Features

1. **Admin Assessment Builder Tab ("Hiring Qualification")**:
   - `Enable Hiring Qualification Evaluation` toggle.
   - Corporate Strategy selector (`TCS`, `INFOSYS`, `ACCENTURE`, etc.).
   - Relational section mapping controls for Numerical, Verbal, Reasoning, Advanced Aptitude, and Coding sections.
   - Threshold inputs for Ninja Total, Digital Total, Prime Total, Advanced Digital/Prime cutoffs, and Coding Digital/Prime min solved.
2. **Candidate Result Page Card ("TCS Hiring Qualification")**:
   - Styled qualification badge with dedicated color-coding:
     - `NOT_QUALIFIED`: Red badge
     - `NINJA`: Blue badge
     - `DIGITAL`: Purple badge
     - `PRIME`: Gold / Amber badge
   - Section-wise sectional cutoff pass/fail breakdown table.
   - Foundation, Advanced, and Coding summary metrics.
   - Qualification reason banner.
3. **Admin Candidates & Reports View**:
   - Added `Hiring Qualification` column with color-coded badges to candidate tables.
   - Added qualification tier filter dropdown (`NOT_QUALIFIED`, `NINJA`, `DIGITAL`, `PRIME`).
   - Updated CSV export generator with strategy & qualification metrics.

---

## 6. Testing & Validation Performed

1. **Backend Unit Test Suites**:
   - `tcs-hiring.strategy.spec.ts`: Passed 6/6 unit tests covering sectional cutoff failure, foundation cutoff failure, Ninja qualification, Digital qualification, Prime qualification, and Prime coding fallback.
   - `hiring-evaluation.engine.spec.ts`: Passed unit tests verifying strategy registry resolution, disabled config fallbacks, and attempt context evaluation.
2. **End-to-End Integration Verification**:
   - Prisma Client generation verified.
   - Contract and Shared packages compiled cleanly.

---

## 7. Edge Cases Handled

- **Disabled / Unconfigured Assessments**: System gracefully skips qualification evaluation and returns standard results.
- **Missing Section Mappings**: Evaluates configured sections; missing category sections default to 0 required minimum.
- **Partial Coding Problem Attempts**: Partial testcase passes (0 < score < 100) are classified as `PARTIAL` and do not count toward fully `SOLVED` problems.
- **Backward Compatibility**: Non-hiring assessments continue operating without DB schema migration errors or API breakage.

---

## 8. Future Extensibility

To add a new hiring strategy (e.g. `InfosysHiringStrategy`):
1. Create `InfosysHiringStrategy` implementing `IHiringEvaluationStrategy`.
2. Register it in `HiringStrategyRegistry`.
3. Add `INFOSYS` to `HiringStrategyType` enum in `schema.prisma`.
No changes are required in `HiringEvaluationEngine`, `ResultGeneratorService`, or `ResultStorageService`.
