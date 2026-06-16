# Template Selection Rules

**Module:** 1.3.1 Template Repository  
**Objective:** Define the rules and logic for matching and selecting templates.  
**Version:** 1.0.0

---

## 1. Selection Pipeline Flow

When the assessment engine generates an exam, it performs a cascading match starting from the exam blueprint down to the selected question templates:

```
+──────────────────────────────────────────────────+
| 1. Blueprint Configuration                       | (Reads target topic, concept, and difficulty mix)
+──────────────────────────────────────────────────+
                         │
                         ▼
+──────────────────────────────────────────────────+
| 2. Concept Match                                 | (Filters templates by topicId and conceptId)
+──────────────────────────────────────────────────+
                         │
                         ▼
+──────────────────────────────────────────────────+
| 3. Difficulty Compatibility Match                | (Filters by difficulty level and allowed types)
+──────────────────────────────────────────────────+
                         │
                         ▼
+──────────────────────────────────────────────────+
| 4. Selection & De-duplication                    | (Selects templates randomly/seeded without duplicates)
+──────────────────────────────────────────────────+
```

---

## 2. Selection Steps

### Step 1: Query Blueprint Specifications

- For each question slot in the blueprint, extract the required:
  - `topicId`
  - `conceptId`
  - `difficulty` (easy, medium, hard)

### Step 2: Apply Primary Filter

- Query the template repository to fetch templates matching:
  - `active === true`
  - `topicId === blueprint.topicId`
  - `conceptId === blueprint.conceptId`

### Step 3: Apply Difficulty and Type Compatibility

- Filter out any templates where:
  - `template.difficulty !== blueprint.difficulty`
  - The `template.templateType` is incompatible with the target difficulty according to `difficulty-mapping.md`.

### Step 4: De-duplication Check

- Filter out templates that have already been selected for another question slot in the same exam instance.

---

## 3. Fallback Strategies

If the selection candidate pool is empty after applying all filters, the engine enforces the following fallback priority queue:

1. **Fallback 1: Concept Relaxation (Same Topic, Alternative Concept)**
   - Search for templates within the _same_ `topicId` and `difficulty` that are associated with a closely related `conceptId` (defined in the Topic Registry's concept list).
2. **Fallback 2: Difficulty Level Shifting**
   - If no templates exist for the target difficulty, look for templates targeting an adjacent difficulty tier (e.g., if `hard` is empty, check `medium`).
3. **Fallback 3: System Error Flag**
   - If no templates match the topic at any difficulty, halt generation and throw a configuration mismatch error: `"No templates found matching Topic {topicId}."`

---

## 4. Randomization Seeding

To ensure reproducible testing:

- The selector uses a SFC32 Pseudo-Random Number Generator.
- The seed is composed of: `examConfigId` + `candidateId` + `questionSlotIndex`.
- This ensures that while two candidates get different sets of questions, a single candidate's session retains the exact same selected templates on page reloads/retries.
