# Template Contract Specification

**Module:** 1.3.1 Template Repository  
**Objective:** Define the interface for the Question Template item.  
**Version:** 1.0.0

---

## 1. Interface Definition

All question templates within the system must comply with the following TypeScript model contract:

```typescript
import { VariableSchema } from "./variable-schema";

export interface QuestionTemplate {
  /**
   * Unique system identifier (UUID or similar format).
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
   * Classification type mapping to template-types.
   * Must match one of: "mcq", "multiple-select", "true-false", "fill-blank", "code-output", "debugging", "scenario-based", "case-study"
   */
  templateType: string;

  /**
   * Target Topic Registry ID.
   * Example: "se-ds-001"
   */
  topicId: string;

  /**
   * Specific concept ID.
   * Example: "sliding-window"
   */
  conceptId: string;

  /**
   * Targeted cognitive difficulty.
   */
  difficulty: "easy" | "medium" | "hard";

  /**
   * Template body text containing placeholder variables wrapped in brackets.
   * Example: "What is the output of the following loop: \n {CODE_SNIPPET}"
   */
  templateText: string;

  /**
   * The collection of variable schemas required for hydration.
   */
  variableSchema: VariableSchema[];

  /**
   * Status flag. If false, the template is deprecated and should not be selected for new assessments.
   */
  active: boolean;
}
```

---

## 2. Field Details and Constraints

### `id`

- **Type:** `string` (UUID).
- **Constraints:** Must be unique globally.

### `code`

- **Type:** `string`.
- **Constraints:** Must be unique globally. Used for human troubleshooting, auditing, and seeding. Suggested pattern: `{domain}-{subtopic}-{concept}-{type}-{index}`.

### `templateType`

- **Type:** `string`.
- **Constraints:** Must match a valid template type from the `template-types.md` catalog.

### `topicId` / `conceptId`

- **Type:** `string`.
- **Constraints:** Must reference active values registered in the upstream **Topic Registry**.

### `difficulty`

- **Type:** `'easy' | 'medium' | 'hard'`.
- **Constraints:** Constrained by the Topic Registry's `difficultySupport` matrix for the matched concept.

### `templateText`

- **Type:** `string`.
- **Constraints:** Non-empty string. Every placeholder string wrapped in curly braces (e.g. `{VAR}`) must have a matching variable definition inside the `variableSchema` array.
