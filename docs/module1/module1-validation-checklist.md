# Module 1 Validation Checklist

This document details the validation rules, required components, pass/fail thresholds, and error definitions for the Cross-Module Validation Engine.

## Required Components

To pass the cross-module validation, the following chain of components must be fully configured and referentially linked:

$$\text{Exam Config} \rightarrow \text{Sections} \rightarrow \text{Topics} \rightarrow \text{Concepts} \rightarrow \text{Templates} \rightarrow \text{Blueprint} \rightarrow \text{Readiness}$$

---

## Validation Layers and Rules

### 1. Configuration Layer
- **Exam Config Exists:** The configuration must exist in the database, be active (`isActive = true`), and not archived (`isArchived = false` or status `ARCHIVED`).
- **Sections Exist:** The configuration must contain at least one `ExamSection`.
- **Rules Exist:** A corresponding `RuleFlags` record must exist.
- **Difficulty Distribution Configured:** A corresponding `DifficultyDistribution` record must exist.
- **Difficulty Percentages Valid:** The sum of `easyPercentage`, `mediumPercentage`, and `hardPercentage` in the difficulty distribution must be exactly $100\%$.
- **Question Count Matching:** The sum of all question counts across the sections must equal `ExamConfig.totalQuestions`.

### 2. Knowledge Layer
- **Topics Assigned:** Each section configured in the exam config must have at least one topic assigned via the `SectionTopic` junction model.
- **Concepts Exist:** Each assigned topic must have at least one active `Concept` record in the database.
- **Section Topic Weightages Valid:** For each section, the sum of `TopicWeightage.weightagePercentage` for all topics assigned to that section must equal exactly $100\%$.

### 3. Template Layer
- **Templates Exist:** For each active concept in the topics mapped to the exam config's sections, there must be at least one active `Template` with `conceptKey` matching the concept's code.
- **Variables Valid:** Any variables configured in the template must have unique names, and default values must be compatible with the variable type.
- **Rules Valid:** Template rules must target existing variables, and rule configurations (range limits, lengths, regular expressions) must be compatible with the variable types.
- **Solution Templates Exist:** A `SolutionTemplate` must be configured for each template to verify that model solutions are available.

### 4. Blueprint Layer
- **Blueprint Exists:** A `Blueprint` record must be configured and linked to the exam configuration.
- **Blueprint Valid:** Topic allocations and difficulty distributions specified in the blueprint sections must each sum to $100\%$. Additionally, active templates must be available for all allocated topic-difficulty configurations.
- **Style Profile Assigned:** A `StyleProfile` must be assigned to the blueprint, and it must be active in the database.

---

## Pass Criteria (READY)
- All layer validation checks return `valid: true` (no errors).
- Overall system validation score is $100$.
- Readiness status is marked as **READY**.

## Warning Criteria (PARTIALLY READY)
- Overall validation score is between $50$ and $75$.
- Non-critical mismatch errors are present (e.g. minor rule warnings).

## Failure Criteria (NOT READY)
- Any layer validation returns `valid: false` (errors present).
- Overall validation score is less than $50$.
- Missing core components (e.g., section has no topics, blueprint does not exist, templates are missing).
