# Rollback Design Specification

**Module:** 1.3.2 Template Versioning System  
**Objective:** Define the procedure, state changes, and audits for version rollbacks.  
**Version:** 1.0.0

---

## 1. Rollback Process

A rollback reverts a template's active configuration to a previous state recorded in the snapshot table. To maintain historical integrity, a rollback does not delete intervening records; it performs a **forward rollback**:

```
Current State: Template (Version: 3)
Rollback Target: Version 1

Result:
1. Fetch snapshot for Version 1 from TemplateVersion table.
2. Update active Template record properties with the snapshot values.
3. Increment active Template version from 3 to 4.
4. Record Version 4 snapshot in the TemplateVersion table.
```

This ensures that the database version history remains strictly linear and monotonic.

---

## 2. Conflict Handling

During a rollback, parent dependencies might have changed. The rollback engine must resolve the following conflicts before proceeding:

1.  **Orphaned Topic/Concept:**
    *   *Conflict:* The target snapshot references a `topicId` or `conceptId` that has since been deleted or deactivated in the Topic Registry.
    *   *Resolution:* The rollback must fail validation, throwing a `ConflictException`: `"Cannot rollback template: referenced concept {conceptId} is inactive."`
2.  **Duplicate Active Code:**
    *   *Conflict:* The target snapshot has a `code` that was changed in the newer versions, and another active template has since registered that same `code`.
    *   *Resolution:* Block rollback and alert the administrator to change the conflicting code or archive the competing template first.

---

## 3. Audit Trail

To track administrative actions, every rollback must write an entry to the system audit logs containing:

*   **`actorId`**: The User ID of the administrator who triggered the rollback.
*   **`templateId`**: The target template.
*   **`sourceVersion`**: The version number we rolled back from.
*   **`targetVersion`**: The snapshot version number we restored.
*   **`newVersion`**: The resulting new version number.
*   **`timestamp`**: The exact datetime of the operation.
*   **`reason`**: An optional text explaining the rollback reason.
