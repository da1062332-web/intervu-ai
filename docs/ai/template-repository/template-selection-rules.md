# Template Selection Rules

**Module:** 1.3.1 Template Repository  
**Objective:** Define the rules and logic for matching and selecting templates.  
**Version:** 1.0.0

---

## 1. Selection Pipeline Flow

When generating an assessment, the generation engine resolves template matching through a multi-step selection pipeline:

```
[ 1. Blueprint Configuration ] ──> Reads target topic, concept, and difficulty mix.
             │
             ▼
[ 2. Concept Match ] ───────────> Filters templates where topicId and conceptId match.
             │
             ▼
[ 3. Difficulty Match ] ────────> Filters by difficulty and checks compatibility mapping.
             │
             ▼
[ 4. De-duplication check ] ───> Filters out templates already selected in same exam.
             │
             ▼
[ 5. Deterministic Seed Selection ] ──> Selects template using a SFC32 PRNG.
```

---

## 2. Selection Steps

### Step 1: Blueprint Resolution

The selector reads the assessment blueprint configuration to identify requirements for each question slot, extracting:

- `topicId` (Topic ID)
- `conceptId` (Concept ID)
- `difficulty` (`easy`, `medium`, `hard`)

### Step 2: Primary Filtering

The registry query returns candidate templates matching:

- `active === true`
- `topicId === blueprint.topicId`
- `conceptId === blueprint.conceptId`

### Step 3: Difficulty and Type Mapping

Enforce the **Difficulty Compatibility Matrix**:

- Discard templates where `template.difficulty !== blueprint.difficulty`.
- Discard templates whose `templateType` is incompatible with the target difficulty (e.g., `True/False` for `hard` difficulty).

### Step 4: De-duplication

To avoid candidate fatigue, filter out templates that have already been selected for another slot in the same exam instance.

---

## 3. Deterministic Selection Seeding

To ensure that candidate questions are random yet reproducible, selection uses a **SFC32 Pseudo-Random Number Generator (PRNG)**.

- **Seed Generation:**
  $$\text{Seed} = \text{SHA-256}(\text{examConfigId} + \text{candidateId} + \text{questionSlotIndex})$$
- **Result:**
  - Two different candidates will receive different selected templates (ensuring fairness).
  - A single candidate's session will always select the identical templates on page refreshes or connection retries, preventing cheating.

---

## 4. Fallback Strategies

If the candidate pool is empty after all filters are applied:

1.  **Concept Relaxation:** Query templates under the same `topicId` and `difficulty` mapping to related/adjacent concepts.
2.  **Difficulty Tier Shifting:** Look for adjacent difficulty templates (e.g., fallback from `hard` to `medium` for same concept).
3.  **Fatal Configuration Error:** If no templates match the topic, halt generation and return: `"No templates found matching Topic {topicId}."`
