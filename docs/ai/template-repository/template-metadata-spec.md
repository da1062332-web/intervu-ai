# Template Metadata Specification

**Module:** 1.3.1 Template Repository  
**Objective:** Define metadata standards and fields for question templates.  
**Version:** 1.0.0

---

## 1. Metadata Standard

To organize, index, and query templates efficiently, every template in the repository must be annotated with the following metadata fields. These are essential for matching templates to blueprints and tracking history.

---

## 2. Required Fields

Every template must contain the following metadata attributes:

### 1. Topic
*   **Field:** `topicId`
*   **Description:** The canonical ID of the topic in the Topic Registry.
*   **Validation:** Must reference an active, existing topic.
*   **Example:** `"se-lang-003"` (Software Engineering Languages)

### 2. Concept
*   **Field:** `conceptId`
*   **Description:** The specific sub-skill targeted.
*   **Validation:** Must match a concept linked to the topic.
*   **Example:** `"Closures & Scope"`

### 3. Difficulty
*   **Field:** `difficulty`
*   **Description:** The targeted cognitive load.
*   **Validation:** Must be `'easy'`, `'medium'`, or `'hard'`.
*   **Example:** `"medium"`

### 4. Template Type
*   **Field:** `templateType`
*   **Description:** The classification category of the question.
*   **Validation:** Must match one of the 8 supported types in the Registry.
*   **Example:** `"debugging"`

### 5. Version
*   **Field:** `version`
*   **Description:** The current revision of the template.
*   **Validation:** Positive integer incrementing sequentially.
*   **Example:** `1`

### 6. Author
*   **Field:** `authorId` / `creatorId`
*   **Description:** The system identifier of the developer or user who registered/edited the template.
*   **Validation:** Must be a valid User ID in the database.
*   **Example:** `"usr_9a8b7c6d"`

### 7. Created Date
*   **Field:** `createdAt`
*   **Description:** The ISO timestamp when the template version was created.
*   **Validation:** Date object.
*   **Example:** `"2026-06-17T10:00:00.000Z"`

### 8. Status
*   **Field:** `status` / `active`
*   **Description:** The current state of the template.
*   **Validation:** Represents whether the template is a `Draft`, `Published` (active: true), or `Archived` (active: false).
*   **Example:** `true` (Active/Published)
