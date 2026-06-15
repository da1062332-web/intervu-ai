# AI Validation Specification for Topic Registry

**Module:** Module 1.2.1 Topic Registry  
**Purpose:** Enforce Structural and Logical Soundness on Seed Files  
**Version:** 1.0.0

---

## 1. Objective

To prevent runtime crashes and faulty question generation, the registry JSON files must pass validation before being loaded into memory or database storage. This document specifies the validation criteria that any registry parser/loader must enforce.

---

## 2. Validation Constraints

Any registry file (e.g. `software-engineering.json`) is parsed as an array of `TopicRegistryItem` objects. The validation service checks:

### Rule 1: Required Text Fields

- **Topic Required:** Each item must contain a non-empty, trimmed `topic` string.
- **Subtopic Required:** Each item must contain a non-empty, trimmed `subtopic` string.
- **Domain Required:** Each item must contain a non-empty, trimmed `domain` string.
- _Failure Behavior:_ Reject the registry item if any field is missing, null, or only whitespace.

### Rule 2: Non-Empty Concept Array

- **Constraint:** The `concepts` property must be an array containing **at least one** non-empty string.
- _Failure Behavior:_ Reject the item if `concepts` is missing, is not an array, is empty, or contains blank strings.

### Rule 3: Unique Topic IDs

- **Constraint:** The `id` of each registry item must be unique across the entire JSON array. Duplicate IDs are strictly prohibited.
- _Failure Behavior:_ Terminate the parser and throw a duplicate ID exception.

### Rule 4: Unique Concept Names inside Topic

- **Constraint:** Concept strings within a single registry item's `concepts` array must be unique.
- _Failure Behavior:_ Reject the item if duplicate concepts exist within its own concept array (e.g., `["Joins", "Joins"]`).

### Rule 5: Difficulty Support Guardrails

- **Constraint:** At least one of the difficulty support boolean values (`easy`, `medium`, `hard`) must be set to `true`.
- _Failure Behavior:_ Reject the item if all difficulty levels are set to `false`, as it would make the topic impossible to select at any tier.

---

## 3. Zod Schema Implementation Blueprint

When implemented in TS, the parser should execute this validation using a `zod` schema check:

```typescript
import { z } from "zod";

const TopicRegistryItemSchema = z
  .object({
    id: z.string().min(1, "Topic ID must not be empty"),
    domain: z.string().min(1, "Domain must not be empty"),
    topic: z.string().min(1, "Topic must not be empty"),
    subtopic: z.string().min(1, "Subtopic must not be empty"),
    concepts: z
      .array(z.string().min(1))
      .min(1, "At least one concept is required"),
    tags: z.array(z.string()),
    difficultySupport: z
      .object({
        easy: z.boolean(),
        medium: z.boolean(),
        hard: z.boolean(),
      })
      .refine((support) => support.easy || support.medium || support.hard, {
        message: "At least one difficulty level must be set to true",
      }),
  })
  .refine(
    (item) => {
      const uniqueConcepts = new Set(item.concepts);
      return uniqueConcepts.size === item.concepts.length;
    },
    {
      message: "Concept names must be unique within the same registry item",
      path: ["concepts"],
    },
  );

// Schema for validating the entire registry array
export const TopicRegistrySchema = z.array(TopicRegistryItemSchema).refine(
  (items) => {
    const ids = items.map((item) => item.id);
    const uniqueIds = new Set(ids);
    return uniqueIds.size === items.length;
  },
  { message: "All topic registry item IDs must be unique" },
);
```
