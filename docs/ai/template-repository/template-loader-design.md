# Registry Loader Design

**Module:** 1.3.1 Template Repository  
**Objective:** Define the service contracts and method signatures for template retrieval.  
**Version:** 1.0.0

---

## 1. Overview

The `TemplateLoaderService` acts as the interface between storage (JSON files, database, or memory cache) and the template selection engine. It hides retrieval complexity and provides type-safe query interfaces.

---

## 2. Service Interface Contract

```typescript
import { QuestionTemplate } from "./template-contract";

export interface TemplateLoader {
  /**
   * Initializes the repository by loading all active templates from storage into memory.
   * Rejects if any templates fail verification rules in template-validation.md.
   */
  loadTemplates(): Promise<QuestionTemplate[]>;

  /**
   * Retrieves a specific template by its unique ID.
   * Returns null if not found.
   */
  getTemplateById(id: string): Promise<QuestionTemplate | null>;

  /**
   * Retrieves all templates associated with a specific concept.
   */
  getTemplatesByConcept(conceptId: string): Promise<QuestionTemplate[]>;

  /**
   * Retrieves all templates matching a specific difficulty level.
   */
  getTemplatesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<QuestionTemplate[]>;

  /**
   * Retrieves all templates matching a specific question type.
   */
  getTemplatesByType(type: string): Promise<QuestionTemplate[]>;
}
```

---

## 3. Query Filtering Rules

* **Active-Only Constraint:** All query methods (except when fetching explicitly by `id` for audit purposes) must default to filtering out inactive templates (`active: true`).
* **Caching Layer:** The loader implementation should cache templates in-memory after the initial `loadTemplates()` execution to ensure rapid lookups during generation loops.
* **Error Handling:** If database queries timeout, methods must return empty arrays or throw a standardized `TemplateRepositoryException` rather than exposing raw database errors.
