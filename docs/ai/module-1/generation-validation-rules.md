# AI Generation Input Validation Rules

**Module:** Module 1: Exam Config Manager  
**Consumer:** Module 2: Question Generation Engine  
**Version:** 1.0.0

---

## Objective

This document outlines the strict schema validation rules enforced on the input payload before it is forwarded to the AI Question Generation Engine (Module 2). Validating these configurations prevents downstream runtime issues, avoids wasting LLM token consumption on invalid parameters, and ensures strict consistency.

---

## Schema Validation Rules

Every input payload matching the `GenerationInput` structure must pass the following validation rules:

| Field | Rule Type | Validator Constraint | Error Message / Behavior |
| :--- | :--- | :--- | :--- |
| `examConfigId` | **Required** | Must be a non-empty string. Should conform to the system's UUID/trace key format. | `"Exam config ID is required."` |
| `role` | **Required** | Must be a non-empty string. Must match one of the recognized professional domains. | `"Target role is required."` |
| `totalQuestions` | **Value Bound** | Must be an integer $> 0$. | `"Total questions must be at least 1."` |
| `durationMinutes` | **Value Bound** | Must be an integer $> 0$. | `"Duration must be at least 1 minute."` |

---

## Validation Rule Specifications

### 1. `examConfigId`
* **Rule:** Must be provided.
* **Type:** `string` (non-empty).
* **Detailed Rationale:** The generation pipeline relies on `examConfigId` to associate the generated output pool with the initiating template. Without it, generation results cannot be stored or tracked in the database.

### 2. `role`
* **Rule:** Must be provided.
* **Type:** `string` (non-empty).
* **Detailed Rationale:** The prompt template relies on the `role` parameter to establish context. An empty role string would cause the prompt parser to produce incomplete instructions, leading to generic or malformed question content.

### 3. `totalQuestions`
* **Rule:** Must be $> 0$.
* **Type:** `number` (integer).
* **Detailed Rationale:** The generation loop uses this count to control the number of questions produced. Negative values, zero, or decimal numbers will cause loop errors or boundary exceptions in the generation engine.

### 4. `durationMinutes`
* **Rule:** Must be $> 0$.
* **Type:** `number` (integer).
* **Detailed Rationale:** Used for calculating average solving time per question and regulating difficulty. A duration of zero or less makes it impossible to perform difficulty balancing calculations.

---

## Zod Implementation Blueprint (Future Reference)

When these validation rules are implemented programmatically in the codebase (e.g., in `@intervu-ai/validation-core` or `@intervu-ai/contracts`), they should map to the following Zod schema:

```typescript
import { z } from 'zod';

export const GenerationInputSchema = z.object({
  examConfigId: z.string({
    required_error: "Exam config ID is required.",
  }).min(1, "Exam config ID cannot be empty."),

  role: z.string({
    required_error: "Target role is required.",
  }).min(1, "Target role cannot be empty."),

  totalQuestions: z.number({
    required_error: "Total questions is required.",
  }).int("Total questions must be an integer.")
    .positive("Total questions must be at least 1."),

  durationMinutes: z.number({
    required_error: "Duration is required.",
  }).int("Duration must be an integer.")
    .positive("Duration must be at least 1 minute."),
});

export type GenerationInput = z.infer<typeof GenerationInputSchema>;
```
