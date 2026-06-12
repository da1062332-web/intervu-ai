# Day 3 — AI Validation Engine Foundation Documentation

This document describes the design, architecture, validation logic, scoring system, and performance metrics of the Question Validation & Quality Assurance Engine implemented in the `@intervu-ai/ai-core` package.

---

## 1. Engine Architecture

The validation engine acts as a **Quality Gate** sitting between question generation and storage. It ensures that no structurally broken, incorrect, ambiguous, or poorly formatted questions enter the Question Pool or Test Assembly Engine.

```
       [Generated Question DTO]
                  ↓
+-----------------------------------+
|    ValidationOrchestrator         |
+-----------------------------------+
                  ↓
  +-------------------------------+
  |  1. Structure Validator (25%) | ---> Verifies all mandatory fields are present
  +-------------------------------+
                  ↓
  +-------------------------------+
  |  2. Answer Validator (25%)    | ---> Asserts correctness, MCQ options, & math logic
  +-------------------------------+
                  ↓
  +-------------------------------+
  |  3. Difficulty Validator (20%)| ---> Asserts solution steps align with difficulty
  +-------------------------------+
                  ↓
  +-------------------------------+
  |  4. Ambiguity Validator (10%) | ---> Detects unresolved placeholders or missing data
  +-------------------------------+
                  ↓
  +-------------------------------+
  |  5. Quality Validator (20%)   | ---> Verifies length, formatting, and readability
  +-------------------------------+
                  ↓
       [QuestionValidationDto]
```

---

## 2. Validation Pipeline Flow

Every validation stage returns a localized score and pass status. The orchestrator sums the scores and collects all failure reasons and warning messages:

- **All stages must pass**: If any individual stage fails (`passed === false`), the question is rejected.
- **Structure Pre-emption**: If the question fails structure validation, it is deemed completely unusable, and the overall score is set to `0`.
- **Passing Threshold**: A question must score $\ge 80$ and pass all stages to be accepted.

---

## 3. Scoring Rules

| Validation Stage | Max Score | Key Assertions                                                                                                                                                                                    |
| :--------------- | :-------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Structure**    |    25     | Checks presence of `questionText`, `correctAnswer`, `solution`, `metadata`, `questionType`, and `difficultyLevel`. Checks conformity to the Zod contract schema.                                  |
| **Answer**       |    25     | Verifies answer is non-empty, MCQ options contain the correct answer (capping at 4-6 options), numeric answers represent a valid number, and the solution steps contain the correct answer logic. |
| **Difficulty**   |    20     | Estimates calculation step count from solution steps or metadata, ensuring it matches the assigned difficulty (Easy: 1-2, Medium: 2-4, Hard: 4+).                                                 |
| **Ambiguity**    |    10     | Checks for unresolved brackets (e.g. `{variable}`), empty placeholders (`__`, `[]`), or parameters in text that are missing from metadata.                                                        |
| **Quality**      |    20     | Checks question length ($\ge 15$), solution length ($\ge 15$), capitalized starting characters, trailing whitespaces, and punctuation.                                                            |
| **Total**        |  **100**  | **Passing Score: 80+**                                                                                                                                                                            |

---

## 4. Error Code Catalog

Every failure provides a unique error code and reason.

| Code                     | Triggering Stage       | Description                                                                   |
| :----------------------- | :--------------------- | :---------------------------------------------------------------------------- |
| `MISSING_QUESTION_TEXT`  | Structure              | The question text is empty or missing.                                        |
| `MISSING_ANSWER`         | Structure / Answer     | The correct answer is empty or missing.                                       |
| `MISSING_SOLUTION`       | Structure              | The explanation solution is empty or missing.                                 |
| `INVALID_QUESTION_TYPE`  | Structure              | The question type is not mcq, numeric, or coding.                             |
| `INVALID_DIFFICULTY`     | Structure / Difficulty | Difficulty level is unknown, or step count mismatches difficulty.             |
| `MISSING_METADATA`       | Structure / Quality    | Metadata is empty or missing.                                                 |
| `INVALID_OPTION_SET`     | Answer                 | Options array is missing, or length does not match MCQ requirements (4 to 6). |
| `INVALID_MCQ_OPTIONS`    | Answer                 | The correct answer does not exist in the MCQ options list.                    |
| `INVALID_NUMERIC_ANSWER` | Answer                 | Correct answer is not a valid numeric value for a numeric question.           |
| `MISSING_ANSWER_LOGIC`   | Answer                 | The solution steps do not contain the correct answer logic.                   |
| `AMBIGUOUS_QUESTION`     | Ambiguity              | Unresolved placeholder brackets, double underscores, or duplicate variables.  |
| `QUALITY_FAILURE`        | Quality                | Question/solution is too short, or has poor formatting/punctuation.           |
| `VALIDATION_SCORE_FAIL`  | Orchestrator           | Validation score is below the passing threshold of 80.                        |

---

## 5. Examples

### A. Valid MCQ Question (PASS)

```json
{
  "questionId": "q_val_001",
  "templateId": "tpl_val_001",
  "conceptKey": "percentages",
  "difficultyLevel": "easy",
  "questionType": "mcq",
  "questionText": "If the price of petrol is increased by 25%, by how much percent must a motorist reduce the consumption of petrol?",
  "options": ["15", "20", "22", "30"],
  "correctAnswer": "20",
  "solution": "{\"steps\":[\"New price is 125.\",\"Reduction = (25 / 125) * 100 = 20%.\"],\"finalAnswer\":\"20\"}",
  "metadata": { "percent_increase": 25, "steps": 2 }
}
```

**Validation Output**:

```json
{
  "questionId": "q_val_001",
  "isValid": true,
  "passed": true,
  "score": 100,
  "errors": [],
  "warnings": [],
  "validatedAt": "2026-06-10T11:40:02.123Z"
}
```

### B. Mismatched Difficulty Question (FAIL)

```json
{
  "questionId": "q_val_002",
  "templateId": "tpl_val_002",
  "conceptKey": "percentages",
  "difficultyLevel": "easy",
  "questionType": "mcq",
  "questionText": "If the price of petrol is increased by 25%, by how much percent must a motorist reduce the consumption of petrol?",
  "options": ["15", "20", "22", "30"],
  "correctAnswer": "20",
  "solution": "{\"steps\":[\"Step 1\",\"Step 2\",\"Step 3\",\"Step 4\",\"Step 5\"],\"finalAnswer\":\"20\"}",
  "metadata": { "percent_increase": 25, "steps": 5 }
}
```

**Validation Output**:

```json
{
  "questionId": "q_val_002",
  "isValid": false,
  "passed": false,
  "score": 80,
  "errors": [
    {
      "code": "INVALID_DIFFICULTY",
      "reason": "Question difficulty is 'easy', but it has 5 step(s) (expected: easy: 1-2, medium: 2-4, hard: 4+)."
    }
  ],
  "warnings": [],
  "validatedAt": "2026-06-10T11:40:02.456Z"
}
```

---

## 6. Performance Metrics

A bulk performance test dataset of **100 sample questions** containing valid, invalid, easy, medium, and hard difficulty distributions was validated to verify SLA throughput:

- **SLA Target**: Validate 100 questions under **3 seconds** (3000ms).
- **Actual Result**: Validated 100 questions in **8ms**.
- **Efficiency**: Fully optimized for real-time validation inside background workers and assembly workloads without blocking event loops.
