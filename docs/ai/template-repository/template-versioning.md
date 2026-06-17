# Template Versioning Architecture

**Module:** 1.3.2 Template Versioning System  
**Objective:** Define the rules and mechanics of versioning, immutability, and state progression.  
**Version:** 1.0.0

---

## 1. Version Lifecycle Flow

When a template is updated, its version increases linearly. Past states are preserved as read-only snapshots.

```
[ v1: Published ] (Active: true, Immutable)
       │
       ▼ (User requests edit)
[ v2: Draft ] (Active: false, Mutable)
       │
       ▼ (User publishes v2)
[ v2: Published ] (Active: true, v1 becomes Active: false)
```

---

## 2. Versioning Rules

To protect historical assessment data and ensure reproducibility, the versioning system enforces the following rules:

### 1. Published Version Immutability
Once a template version is set to `Published` (or active), it is locked. The text, variables, topic mappings, and difficulty levels cannot be modified in place. This guarantees that candidates taking an exam yesterday and today see identical question parameters if using the same version.

### 2. New Changes Create New Version
If a published template needs to be modified:
1.  The user edits a draft workspace copy.
2.  Upon publishing, the current active version's flag is updated to `active: false` (archived/deprecated).
3.  A new template version is generated with the incremented version counter (`currentVersion + 1`) and set to `active: true`.
4.  A copy of the old template's fields is written to the snapshot log.

### 3. Rollback Support
Administrators can restore any previous version snapshot. Restoring a version does not delete the history; it creates a new active version that matches the snapshot content.

### 4. History Preservation
Version snapshots are never hard-deleted during edits or updates. They are preserved in the `TemplateVersion` snapshot table to maintain trace capability for all generated questions.
