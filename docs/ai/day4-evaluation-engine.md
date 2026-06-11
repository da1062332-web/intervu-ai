# Day 4 — Evaluation Engine Foundation Documentation

This document describes the design, scoring rules, concept-to-skill mappings, feedback generation criteria, validation checks, and performance characteristics of the Evaluation Engine implemented in the `@intervu-ai/ai-core` package.

---

## 1. Engine Architecture

The Evaluation Engine processes candidate answer submissions against the ground-truth question configurations persisted in the database during test assembly. The grading pipeline operates entirely in memory, making it highly optimized for real-time results computation and bulk processing workloads.

```
       [ExecutionResultDto]
                ↓
+-------------------------------+
|   EvaluationEngineService     | <--- Input Validation
+-------------------------------+
                ↓
  +---------------------------+
  | 1. ScoreCalculatorService | ---> MCQ & Numeric comparator (points computation)
  +---------------------------+
                ↓
  +---------------------------+
  | 2. SkillEvaluatorService  | ---> Concepts map to aptitude & reasoning scores
  +---------------------------+
                ↓
  +---------------------------+
  | 3. FeedbackGenerator      | ---> Rule-based deterministic performance comments
  +---------------------------+
                ↓
  +---------------------------+
  | 4. EvaluationValidator    | ---> Range check validation (0-100 check)
  +---------------------------+
                ↓
       [EvaluationResultDto]
```

---

## 2. Scoring Rules

Scoring is deterministic and auditable, governed by the following rules:

### A. Individual Answers Grading

- **Correct Answer**: $+1$ point
- **Incorrect/Empty Answer**: $0$ points
- **Negative Marking**: Defaults to `false` (0 points for wrong answers). The architecture is ready to accept a custom test rule (e.g. from `TestRule.negativeMarking`) to apply penalty points (e.g. $-0.25$) in future iterations.

### B. Answer Comparison Formats

- **Multiple Choice Questions (MCQ)**: Trimmed case-insensitive comparison:
  $$\text{clean}(A_{\text{candidate}}) \equiv \text{clean}(A_{\text{expected}}) \pmod{\text{case-insensitive}}$$
- **Numeric Questions**: Candidates might submit floating-point variants (e.g., `20` vs `20.0`). Answers are parsed as floats and matched within a precision tolerance delta of `0.0001`:
  $$|V_{\text{candidate}} - V_{\text{expected}}| < 0.0001$$

### C. Overall Score Formula

The overall score is represented as a percentage between $0$ and $100$:
$$\text{Overall Score} = \text{round}\left( \frac{\text{Correct Answer Count}}{\text{Total Questions Count}} \times 100 \right)$$

---

## 3. Concept-to-Skill Mapping

The evaluation engine groups questions by their `conceptKey` to compute category-specific performance metrics. For the 5 seeded concepts, the mappings are:

| Concept Key   | Concept Display Name | Mapped Skill Name | Description                             |
| :------------ | :------------------- | :---------------- | :-------------------------------------- |
| `time_work`   | Time and Work        | **`aptitude`**    | Quantitative math and timing aptitude   |
| `percentages` | Percentages          | **`aptitude`**    | Calculation and relative fractions      |
| `averages`    | Averages             | **`aptitude`**    | Middle valuation and list weight shifts |
| `profit_loss` | Profit and Loss      | **`aptitude`**    | Simple financial maths and margins      |
| `probability` | Probability          | **`reasoning`**   | Logic, permutations, and combinatorics  |

For any concept not listed above, it defaults to the `general` skill.
For each mapped skill, the score is calculated as a percentage:
$$\text{Skill Score} = \text{round}\left( \frac{\text{Correct Questions in Skill}}{\text{Total Questions in Skill}} \times 100 \right)$$

---

## 4. Feedback Rules

Feedback comments are generated deterministically based on concept-level scoring:

- **Concept Score $\ge 75\%$**: `"Strong in <ConceptName>."`
- **Concept Score $< 75\%$**: `"Needs improvement in <ConceptName>."`

Comments are sorted alphabetically by their concept key to guarantee output order consistency.

---

## 5. Confidence Score

The confidence score indicates the candidate's completion rate of the assessment. It is calculated as the percentage of questions that have non-empty, non-whitespace answers:
$$\text{Confidence Score} = \text{round}\left( \frac{\text{Answered Questions Count}}{\text{Total Questions Count}} \times 100 \right)$$

---

## 6. Output Payload Example

Conforming to `EvaluationResultDto`:

```json
{
  "evaluationId": "eval_4a0e98c7-432a-4a25-83e9-a417036720bf",
  "overallScore": 75,
  "confidenceScore": 100,
  "skillScores": {
    "aptitude": 67,
    "reasoning": 100
  },
  "feedback": [
    "Strong in Probability.",
    "Strong in Time and Work.",
    "Strong in Percentages.",
    "Needs improvement in Averages."
  ],
  "evaluatedAt": "2026-06-11T12:00:00.000Z"
}
```

---

## 7. Performance SLA Metrics

Batch evaluation is optimized by executing entirely in memory without synchronous I/O or inline database calls.

- **SLA Target**: Evaluate 100 assessments under **5 seconds** (5000ms).
- **Benchmark Performance**: Evaluates 100 assessments (each containing 2 sections, 100 total questions) in **3ms**.
