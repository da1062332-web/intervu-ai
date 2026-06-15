# Generation Input Contract

**Module:** Module 1: Exam Config Manager  
**Consumer:** Module 2: Question Generation Engine  
**Version:** 1.0.0

---

## Objective

This document defines the **Generation Input Contract** that specifies the exact payload sent from Module 1 (Exam Config Manager) to Module 2 (Question Generation Engine). Defining this contract ensures that the configuration dashboard provides a consistent, validated, and traceable payload, which stabilizes question generation, prompt construction, difficulty balancing, and downstream evaluation.

---

## Input Schema Definition

The interface defines the structure of the input object:

```typescript
interface GenerationInput {
  /**
   * Unique identifier of the exam configuration.
   * Used for tracing, versioning, auditing, and regeneration.
   */
  examConfigId: string;

  /**
   * Target job role (e.g., "Software Engineer", "Frontend Engineer", "Backend Engineer", etc.).
   * Controls the context and technical domains of the generated questions.
   */
  role: string;

  /**
   * The exact number of questions to be generated.
   */
  totalQuestions: number;

  /**
   * The total duration allowed for the test in minutes.
   * Used for difficulty and complexity balancing.
   */
  durationMinutes: number;
}
```

---

## Field Specifications

### 1. `examConfigId`
* **Purpose:** Traceability and repeatability.
* **Usage:** Serves as a reference ID in downstream modules. Enables auditing of generated questions and potential regeneration under the exact same configuration parameters.
* **Example:** `"cfg_8f3a92b1-12c4-4632-bd88-91732e4d0f55"`

### 2. `role`
* **Purpose:** Contextual control of generation.
* **Usage:** Guides the LLM's scenario modeling and wording. For example, selecting `"Frontend Engineer"` leads to questions featuring React/browser APIs, while `"Backend Engineer"` generates questions containing database/REST API scenarios.
* **Examples:**
  * `"Software Engineer"`
  * `"Frontend Engineer"`
  * `"Backend Engineer"`
  * `"Data Scientist"`
  * `"Product Manager"`

### 3. `totalQuestions`
* **Purpose:** Specifies the output size.
* **Usage:** Defines the exact number of question entities the generation engine must return in the final question pool.
* **Example:** `30` (Generator must output exactly 30 questions).

### 4. `durationMinutes`
* **Purpose:** Difficulty balancing.
* **Usage:** Tells the generator how much time the candidate has. The complexity and estimated completion time of the questions must be scaled proportionally so the total test duration matches this value.
* **Example:** `60` (The overall pool complexity must be solvable within 60 minutes).

---

## Generation Constraints

### Rule 1: Question Count Enforcement
The generation engine must produce and return **exactly** the value defined in `totalQuestions`. Partial pools or extra questions are considered contract violations.

### Rule 2: Duration Suitability
The total estimated solving time of all generated questions must fit within `durationMinutes`. The complexity of the coding or mathematical tasks must scale downward for shorter durations and upward for longer durations.

### Rule 3: Role Wording Influence
The target `role` must influence the scenarios, variable naming, and technical context used in the questions.
* **Frontend Role:** Questions should utilize UI/DOM, React, state management, CSS layouts, or frontend performance scenarios.
* **Backend Role:** Questions should utilize API design, database querying, system caching, indexing, or backend concurrency scenarios.

---

## Future Inputs (Roadmap)

The following properties are planned for future versions of Module 1 config schema but are not implemented in the current version.

### 1. Difficulty Distribution
Defines the breakdown of question difficulty levels in the generated exam.
```typescript
difficultyDistribution: {
  easy: number;   // e.g., 30 (percent)
  medium: number; // e.g., 50 (percent)
  hard: number;   // e.g., 20 (percent)
}
```

### 2. Section Config
Defines structural sections of the exam, specifying question counts per domain area.
```typescript
sectionConfig: Array<{
  section: string;   // e.g., "Aptitude", "Coding"
  questions: number; // e.g., 10
}>
```

### 3. Rule Flags
Configures runtime options for the exam behavior.
```typescript
ruleFlags: {
  randomizeQuestions: boolean; // e.g., true
}
```

### 4. Style Profiles
Enforces tone and stylistic guidelines based on a specific company standard.
```typescript
styleProfileId: string; // e.g., "google-v1"
```
