# Topic Registry JSON Contract

**Module:** Module 1.2.1 Topic Registry  
**Purpose:** Define Data Contract for Registry Seeding & Validation  
**Version:** 1.0.0

---

## 1. Objective

This document defines the schema of the **Topic Registry Item**. It acts as the boundary contract ensuring that any JSON file loaded into the system (such as the software engineering registry) complies with standard data properties. This guarantees that AI engines, generators, and mapping engines can consistently parse and validate topics.

---

## 2. Interface Definition

Each item in a registry file must match the following TypeScript interface structure:

```typescript
interface TopicRegistryItem {
  /**
   * Unique identifier of the topic registry item.
   * Format suggestion: prefix-topic-number (e.g. "se-ds-001")
   */
  id: string;

  /**
   * Global professional discipline.
   * Example: "Software Engineering"
   */
  domain: string;

  /**
   * Broad subject area.
   * Example: "Data Structures"
   */
  topic: string;

  /**
   * Focused category of the topic.
   * Example: "Arrays & Hashing"
   */
  subtopic: string;

  /**
   * Granular concepts and algorithms that belong to this subtopic.
   * Example: ["Traversal", "Sliding Window", "Two Pointers"]
   */
  concepts: string[];

  /**
   * Classification tags for filtering.
   * Example: ["data-structures", "core", "arrays"]
   */
  tags: string[];

  /**
   * Maps whether this topic's concepts support easy, medium, and hard difficulty levels.
   */
  difficultySupport: {
    easy: boolean;
    medium: boolean;
    hard: boolean;
  };
}
```

---

## 3. Field Specifications

### 1. `id`

- **Purpose:** Unique lookup identifier.
- **Constraints:** Must be a unique string. Special characters other than hyphens/underscores are discouraged.
- **Example:** `"se-ds-001"`

### 2. `domain`

- **Purpose:** High-level namespace grouping.
- **Constraints:** Non-empty string. Used for routing questions to broad categories.
- **Example:** `"Software Engineering"`

### 3. `topic`

- **Purpose:** High-level knowledge area grouping.
- **Constraints:** Non-empty string.
- **Example:** `"Data Structures"`

### 4. `subtopic`

- **Purpose:** Direct parent category of the concepts.
- **Constraints:** Non-empty string.
- **Example:** `"Arrays & Hashing"`

### 5. `concepts`

- **Purpose:** Specific items to target in generation.
- **Constraints:** Array of non-empty strings. Must contain at least one element. Concept names must be unique within this array.
- **Example:** `["Traversal", "Prefix Sum", "Sliding Window"]`

### 6. `tags`

- **Purpose:** Indexing and semantic filtering.
- **Constraints:** Array of strings. Can be empty.
- **Example:** `["data-structures", "core", "arrays"]`

### 7. `difficultySupport`

- **Purpose:** Restricts question generation to appropriate cognitive levels.
- **Constraints:** Object with boolean flags: `easy`, `medium`, and `hard`. At least one flag must be set to `true`.
- **Example:** `{"easy": true, "medium": true, "hard": false}` (indicates that hard questions should not be generated for this topic/subtopic).
