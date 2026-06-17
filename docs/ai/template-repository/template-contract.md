# Template Contract Specification

**Module:** 1.3.1 Template Repository  
**Objective:** Define the system contract for a Question Template.  
**Version:** 1.0.0

---

## 1. TypeScript Model Interface

All question templates within the system must comply with the following TypeScript contract:

```typescript
import { VariableSchema } from "./variable-schema-standard";

export interface QuestionTemplate {
  /**
   * Unique system identifier (UUID or CUID).
   */
  id: string;

  /**
   * A unique human-readable code representation.
   * Example: "se-algo-sliding-window-mcq-01"
   */
  code: string;

  /**
   * Human-readable display name of the template.
   */
  name: string;

  /**
   * Target Topic Registry ID.
   * Example: "se-ds-001"
   */
  topicId: string;

  /**
   * Specific Concept Registry ID.
   * Example: "sliding-window"
   */
  conceptId: string;

  /**
   * Classification type mapping.
   * Must match a valid entry from the template types list.
   */
  templateType: string;

  /**
   * Target difficulty level of the question.
   */
  difficulty: "easy" | "medium" | "hard";

  /**
   * Template body text containing placeholder variables wrapped in brackets.
   * Example: "What is the console output of the loop if initialized with {INITIAL_VALUE}?"
   */
  templateText: string;

  /**
   * Collection of variable schemas required for hydration.
   */
  variables: VariableSchema[];

  /**
   * Status flag. If false, the template is archived/deprecated.
   */
  active: boolean;

  /**
   * Incrementing version identifier for updates.
   */
  version: number;
}
```

---

## 2. Constraints and Rules

*   **`id` Validation:** Must be globally unique.
*   **`code` Uniqueness:** Must be globally unique and alphanumeric/hyphenated. Suggested naming convention: `{domain}-{topic}-{concept}-{type}-{index}`.
*   **`difficulty` Compatibility:** Must match one of `'easy'`, `'medium'`, or `'hard'`. The concept associated with `conceptId` must support this difficulty level.
*   **`templateText` Placeholders:** Must contain at least one placeholder. Every placeholder string wrapped in curly braces (e.g. `{VAR}`) must have a matching variable definition inside the `variables` array.
*   **`active` Selector:** When active is `false`, the template must be filtered out of the active selection pool.
*   **`version` Immutability:** When state is `Published`, any updates must increase this value by 1.
