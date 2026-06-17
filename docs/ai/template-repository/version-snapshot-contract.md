# Version Snapshot Contract

**Module:** 1.3.2 Template Versioning System  
**Objective:** Define the storage contract for historical template snapshots.  
**Version:** 1.0.0

---

## 1. TypeScript Model Interface

To store past states of a template, the system uses the `TemplateVersion` model. It records a snapshot of all properties at the time of version completion:

```typescript
export interface TemplateVersion {
  /**
   * Unique identifier of the version snapshot (UUID/CUID).
   */
  id: string;

  /**
   * Reference to the parent Question Template.
   */
  templateId: string;

  /**
   * The version number of this snapshot.
   * Example: 1, 2
   */
  version: number;

  /**
   * The complete JSON state of the Question Template.
   * Contains fields: name, topicId, conceptId, templateType, templateText, variables, etc.
   */
  snapshot: object;

  /**
   * Timestamp when the snapshot was recorded.
   */
  createdAt: Date;
}
```

---

## 2. Field Specifications

*   **`templateId` Linkage:** Establishes a foreign key connection to the active `Template` record. Deleting a template cascades delete operations to its versions.
*   **`snapshot` Object:** Must capture all operational properties of the `QuestionTemplate` contract. Since the database schema might evolve, saving the state as a self-contained JSON object prevents migration breakages on historical records.
*   **Composite Key:** A database unique constraint is enforced on `[templateId, version]` to prevent duplicate version records for the same template.
