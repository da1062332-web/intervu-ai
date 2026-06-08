# Question Generation Contract Specification

## 1. Purpose
This package defines the canonical contracts and runtime validation schemas for the Question Generation layer of InterVu AI. It ensures that any abstract configuration successfully instantiated into concrete question objects complies with structural expectations before storage, compilation, or execution.

## 2. Consumers
*   **Generation Engine (AI Service):** Uses the contract to instantiate generated questions and validates outputs before returning.
*   **Assembly Engine:** Consumes pools of validated questions to construct tests based on test blueprints.
*   **Backend API Service:** Enforces validation rules on question templates and pools before saving them to the database.
*   **Frontend Rendering Layer:** Imports DTO types to safely render different question types (`mcq`, `numeric`, `coding`) in the candidate's testing environment.
*   **Evaluation Engine:** Consumes the generated answers and correct solutions to grade candidate submissions.

---

## 3. Data Transfer Objects (DTOs) & Validation Rules

### A. Template DTO (`TemplateDto`)
Represents the template used to produce variations of questions.

```typescript
export interface TemplateDto {
  id: string;
  templateKey: string;
  conceptKey: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  questionType: 'mcq' | 'numeric' | 'coding';
  structure: Record<string, unknown>;
  variableSchema: Record<string, unknown>;
  constraints: Record<string, unknown>;
  version: number;
}
```
*   **`id`**: Unique identifier (string). Required.
*   **`templateKey`**: Key naming the specific template. Required.
*   **`conceptKey`**: Domain concept (e.g. `time_work`). Required.
*   **`difficultyLevel`**: Must be one of `'easy'`, `'medium'`, `'hard'`.
*   **`questionType`**: Must be one of `'mcq'`, `'numeric'`, `'coding'`.
*   **`version`**: Integer $> 0$.

### B. Generated Question DTO (`GeneratedQuestionDto`)
Represents the final generated output containing answers and explanations.

```typescript
export interface GeneratedQuestionDto {
  questionId: string;
  templateId: string;
  conceptKey: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  questionType: 'mcq' | 'numeric' | 'coding';
  questionText: string;
  options?: string[];
  correctAnswer: string;
  solution: string;
  metadata: Record<string, unknown>;
}
```
*   **`questionId` / `templateId`**: Unique identifiers. Required.
*   **`questionText`**: The generated question content. Minimum 10 characters.
*   **`correctAnswer` / `solution`**: Exposes the answer and explanations. Required.
*   **`options`**: Required and must contain $\ge 2$ strings if `questionType === 'mcq'`.

### C. Candidate Question DTO (`CandidateQuestionDto`)
A safe version of the generated question for delivery to the candidate during execution, stripping the correct answers and solutions to avoid leakage.

```typescript
export interface CandidateQuestionDto {
  questionId: string;
  conceptKey: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  questionType: 'mcq' | 'numeric' | 'coding';
  questionText: string;
  options?: string[];
}
```

### D. Question Validation DTO (`QuestionValidationDto`)
Reports the output of the validation check after generation.

```typescript
export interface QuestionValidationDto {
  questionId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedAt: string; // ISO 8601 Timestamp
}
```

### E. Question Pool DTO (`QuestionPoolDto`)
Represents the pool of generated questions returned for assembly.

```typescript
export interface QuestionPoolDto {
  questions: GeneratedQuestionDto[];
  total: number;
  generatedAt: string; // ISO 8601 Timestamp
}
```
*   **`questions`**: Must not be empty.
*   **`total`**: Count of questions in pool, must be $\ge 1$.

---

## 4. Example Payload
```json
{
  "questionId": "q_123",
  "templateId": "tpl_001",
  "conceptKey": "time_work",
  "difficultyLevel": "medium",
  "questionType": "mcq",
  "questionText": "If 4 workers complete a task in 6 days...",
  "options": [
    "2",
    "4",
    "6",
    "8"
  ],
  "correctAnswer": "4",
  "solution": "Work formula...",
  "metadata": {
    "estimatedTime": 90
  }
}
```

---

## 5. Failure Case Examples

### Failure Case 1: Missing Required fields in Template
```json
{
  "id": "tpl_abc",
  "conceptKey": "probability",
  "difficultyLevel": "hard",
  "questionType": "numeric",
  "version": 0 // Error: Must be > 0 (Missing templateKey)
}
```

### Failure Case 2: MCQ without Options
```json
{
  "questionId": "q_123",
  "templateId": "tpl_001",
  "conceptKey": "work_time",
  "difficultyLevel": "easy",
  "questionType": "mcq",
  "questionText": "Select the correct option...",
  "correctAnswer": "A",
  "solution": "Simple reasoning.",
  "metadata": {},
  "options": [] // Error: Options must have length >= 2
}
```

---

## 6. Versioning Strategy
Every contract schema exported from this package includes a major/minor version prefix or is versioned under the standard monorepo publishing cycles. The `TemplateDto` includes a `version` field directly to manage dynamic updates to template structures without breaking legacy question definitions.
