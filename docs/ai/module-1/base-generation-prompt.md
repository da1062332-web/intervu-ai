# Base Generation Prompt Template Blueprint

**Module:** Module 1: Exam Config Manager  
**Consumer:** Module 2: Question Generation Engine  
**Version:** 1.0.0

---

## Objective

This document represents the baseline prompt contract draft. It serves as the bridge between structured config parameters and natural language prompt construction inside the Generation Engine (Module 2). Dynamic values received via the `GenerationInput` contract are mapped straight to these prompt placeholder tokens.

---

## Base Prompt Template Contract

```markdown
You are an assessment generation engine.

Role:
{{role}}

Questions Required:
{{totalQuestions}}

Duration:
{{durationMinutes}}
```

---

## Placeholder Specifications

| Token | Source Interface Field | Target Purpose | Value Format / Type |
| :--- | :--- | :--- | :--- |
| `{{role}}` | `GenerationInput.role` | Establishes domain context (e.g., Software Engineer, Frontend Engineer) | Non-empty string. |
| `{{totalQuestions}}` | `GenerationInput.totalQuestions` | Instructs the model on exact output count expected | Integer $> 0$. |
| `{{durationMinutes}}` | `GenerationInput.durationMinutes` | Sets duration guidelines for scaling complexity | Integer $> 0$. |

---

## Usage Guidelines (Module 2 Implementation)

During Module 2 execution, the engine must:
1. Parse the incoming `GenerationInput` object.
2. Hydrate this baseline prompt template using a template engine (e.g., Mustache, Handlebars, or basic string replacement).
3. Append any concept-specific guidelines or question type configurations underneath this system instructions block.
4. Ensure no template tags (like `{{role}}`) remain unhydrated before sending the payload to the LLM (OpenAI / Gemini).
