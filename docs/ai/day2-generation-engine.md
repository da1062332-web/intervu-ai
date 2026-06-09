# Day 2 — Question Generation Engine Foundation Documentation

This document describes the design, architecture, and validation logic of the Question Generation Engine implemented in the `@intervu-ai/ai-core` package.

---

## 1. Engine Architecture

The generation engine uses a modular design separating template selection, parameter generation, hydration, and validation.

```
       [Request]
           ↓
+----------------------+
|   TemplateSelector   | <--- Database (Prisma templates)
+----------------------+
           ↓ [Template]
+----------------------+
|  ParameterGenerator  | <--- Obeying ranges & constraints
+----------------------+
           ↓ [Parameters]
+----------------------+
| QuestionInstantiator | <--- Math Parser & Distractors Solver
+----------------------+
           ↓ [Instantiated DTO]
+----------------------+
| GenerationValidation | <--- Zod validation & MCQ checks
+----------------------+
           ↓
       [Output DTO]
```

---

## 2. Seed-Based Deterministic Strategy

To ensure reproducible runs across candidates, **no direct randomness (`Math.random()`)** is used in the pipeline:
1. A base string (e.g. `templateKey` + `difficultyLevel`) is converted into a 32-bit integer seed.
2. The seed initializes a Pseudo-Random Number Generator (PRNG) implementing the SFC32 algorithm.
3. Every variable index choice, numeric range shift, and MCQ option shuffle utilizes this PRNG.
4. Generating a question with the same template and seed will **always** yield the exact same question text, answer choice layout, and solution steps.

---

## 3. Supported Templates & Concepts

We seeded **15 functional templates** in the database across 5 concepts (each having an easy, medium, and hard variant):
* **`time_work`** (Time and Work calculation)
* **`probability`** (Balls drawing, defective items selection, class overlaps)
* **`percentages`** (Simple %, petrol consumption reduction, candidates marks range)
* **`averages`** (Basic list average, teacher addition weight shift, temperature overlap)
* **`profit_loss`** (Net profit value, CP/SP percentage, machine loss-to-gain rotation)

---

## 4. Output Example (MCQ)

Running `npm run generate:test` outputs the following `GeneratedQuestionDto` payload:

```json
{
  "questionId": "q_786a34cd-f001-447d-8931-1e90b8f04122",
  "templateId": "cju2901fd001f221...",
  "conceptKey": "percentages",
  "difficultyLevel": "medium",
  "questionType": "mcq",
  "questionText": "If the price of petrol is increased by 25%, by how much percent must a motorist reduce the consumption of petrol so as not to increase his expenditure?",
  "options": ["15", "20", "22", "30"],
  "correctAnswer": "20",
  "solution": "{\"steps\":[\"Let the original price be 100 and consumption be 100.\",\"New price = 125.\",\"Reduction in consumption = (25 / 125) * 100.\"],\"finalAnswer\":\"20\"}",
  "metadata": {
    "percent_increase": 25
  }
}
```

---

## 5. Validation Logic

Before a question is accepted, it passes through the `GenerationValidationService`:
* **Structure:** Compares schema properties against `GeneratedQuestionSchema` from `@intervu-ai/contracts`.
* **MCQ Options:** Verifies exactly 4 choices are present, and the correct answer exists within the options list.
* **Metadata Integrity:** Verifies all variables and parameters utilized in hydration are registered in metadata.
