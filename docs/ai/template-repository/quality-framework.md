# AI Quality Framework

**Module:** 1.3.1 Template Repository  
**Objective:** Define standards and auto-rejection rules for generated questions.  
**Version:** 1.0.0

---

## 1. Quality Standards

To ensure that assessments are fair, clear, and high-quality, every generated question must pass the following checks:

### Must Have

- **Single Correct Answer:** There must be exactly one choice in the options array that satisfies the question.
- **No Ambiguous Wording:** The question statement must be grammatically correct, precise, and contain no conflicting statements or double negatives.
- **Difficulty Consistency:** The generated question complexity must match the target difficulty. For example, an "easy" question must not ask for multi-layered logic, and a "hard" question must not be a simple recall task.
- **Concept Alignment:** The question must directly test the concept identified by `conceptId`.
- **Template Traceability:** The question must retain the `templateId` and `version` metadata to allow historical tracing.
- **Version Traceability:** The active `version` of the template must be stamped on the generated question.

---

## 2. Rejection Rules

Any question that violates any of the following rules must be immediately **rejected** by the validation engine, triggering a regeneration:

### 1. Multiple Valid Answers

- **Rule:** If the `options` array contains more than one choice that could be argued as correct, or if the `correctAnswer` is not unique.
- **Reason:** Leads to candidate scoring disputes.

### 2. Ambiguity & Vagueness

- **Rule:** If the question text contains phrases like `"which option might be correct under some circumstances"` without specifying those circumstances.
- **Reason:** Promotes guessing instead of evaluation.

### 3. Option Redundancy / Duplication

- **Rule:** If two choices in `options` are identical (ignoring whitespace and capitalization) or mean the same thing (e.g. `"O(N)"` and `"linear time complexity"` in the same list).
- **Reason:** Reduces testing validity and looks unprofessional.

### 4. Missing Core Metadata

- **Rule:** If the question lacks `templateId`, `topicId`, or `conceptId`.
- **Reason:** Breaks tracing, reporting, and metrics analytics.

### 5. Concept Drift

- **Rule:** If the template targets `Array Traversal` but the generated code snippet only performs `String Concatenation`.
- **Reason:** Violates exam blueprint target weightages.
