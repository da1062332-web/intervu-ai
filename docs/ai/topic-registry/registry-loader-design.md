# Registry Loader Service Architecture Design

**Module:** Module 1.2.1 Topic Registry  
**Purpose:** Architectural Specification for a Future TS Loader Service  
**Version:** 1.0.0

---

## 1. Objective

This document outlines the architectural design for the **TopicRegistryLoader** service. This service will run in the server runtime environment (backend or AI core), responsible for reading registry JSON seed files, running validation rules, caching structures in memory for quick lookups, and providing clean API query interfaces for downstream consumption.

---

## 2. Loader Interface & Class Signature

The registry loader should be designed as a singleton or injectable service class:

```typescript
export interface ITopicRegistryLoader {
  /**
   * Loads and parses all JSON registry files from disk.
   * Runs schema and logical validation checks before storing them in memory.
   * Throws an error if validation fails.
   */
  loadTopics(): Promise<TopicRegistryItem[]>;

  /**
   * Retrieves a specific TopicRegistryItem by its unique ID.
   * Returns null if no matching topic is registered.
   */
  getTopicById(id: string): Promise<TopicRegistryItem | null>;

  /**
   * Retrieves all unique concepts registered under a specific topic name.
   */
  getConceptsByTopic(topicName: string): Promise<string[]>;

  /**
   * Filters and returns concepts under a topic that are compatible with the requested difficulty.
   * Useful for generation pre-filtering.
   */
  getDifficultyCompatibleConcepts(
    topicName: string,
    difficulty: "easy" | "medium" | "hard",
  ): Promise<string[]>;
}
```

---

## 3. Internal Design Decisions

### Memory Caching and Indexing

To ensure high-performance lookups (e.g. during bulk question assembly or rapid config checks):

- The service should cache the registry items inside an in-memory hash map indexed by `id` upon initialization:
  `private registryCache: Map<string, TopicRegistryItem> = new Map();`
- A secondary index of concepts by topic should be cached to avoid scanning the entire registry array on every query:
  `private conceptIndex: Map<string, Set<string>> = new Map();`

### File Reading and File Paths

- The service will dynamically read the JSON seed files (like `software-engineering.json`) from the `@intervu-ai/generation` package using Node's standard file system modules (`fs/promises`).
- Path configurations must use environment-safe path resolution (`path.join`) pointing to the package directory.

### Validation hook

- Immediately after loading the JSON data and before updating the local in-memory cache, the service must execute the validation specification schema (Zod schema checking) defined in `topic-validation.md`. If invalid items are detected, the system must abort startup and log a detailed error.
