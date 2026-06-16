# Output Schema Specification

**Module:** 1.3.1 Template Repository  
**Objective:** Define the structure of the hydrated and generated question.  
**Version:** 1.0.0

---

## 1. Interface Definition

Any question hydrated and generated from a template must adhere to the following contract before validation and storage:

```typescript
export interface GeneratedQuestion {
  /**
   * The final compiled question text presented to the candidate.
   * Placeholders from the template are fully replaced with concrete values.
   */
  questionText: string;

  /**
   * List of possible answers.
   * If questionType is MCQ or Multiple Select, this array contains choices (min 2, typically 4).
   * For other types (e.g. debugging, fill in blank) it can contain options or be empty.
   */
  options: string[];

  /**
   * The correct answer.
   * For MCQ, this must exactly match one of the entries in the options array.
   * For True/False, this is "True" or "False".
   * For Fill in the Blank, it is the target keyword.
   */
  correctAnswer: string;

  /**
   * Detailed breakdown explaining why the correctAnswer is correct and why distractors are wrong.
   */
  explanation: string;

  /**
   * The cognitive difficulty level.
   * Must match: "easy" | "medium" | "hard"
   */
  difficulty: string;

  /**
   * Topic registry namespace reference.
   * Example: "se-ds-001"
   */
  topicId: string;

  /**
   * Concept mapping target reference.
   * Example: "Array Traversal"
   */
  conceptId: string;

  /**
   * The database ID of the template from which this question was generated.
   * Enables full audit traceability.
   */
  templateId: string;
}
```

---

## 2. Field Validation Rules

1. **`questionText` length:** Must be at least 15 characters.
2. **`options` constraint:** If `options` is not empty, there must be no duplicate entries in the array.
3. **`correctAnswer` binding:** If `options` has elements, `correctAnswer` must match exactly one of the values inside `options`.
4. **`explanation` length:** Must be at least 20 characters to guarantee explanatory quality.
5. **Traceability:** `templateId`, `topicId`, and `conceptId` must be non-empty strings.
