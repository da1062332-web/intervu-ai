# Topic Taxonomy Specification

**Module:** Module 1.2.1 Topic Registry  
**Purpose:** AI Generation Source of Truth  
**Version:** 1.0.0

---

## 1. Objective

The **Topic Taxonomy** defines the hierarchical classification schema for organizing technical knowledge on the InterVu AI platform. Standardizing this structure ensures that:

- AI question generators target precise concepts.
- Exams maintain uniform breadth and depth.
- Candidates receive granular scoring and skill evaluation.

---

## 2. Hierarchical Structure

Our taxonomy follows a four-tier nested hierarchy:

```
Domain (The global discipline, e.g., Software Engineering)
 └── Topic (Major knowledge area, e.g., Data Structures)
       └── Subtopic (Focused category, e.g., Arrays)
             └── Concept (Atomic skill tested, e.g., Sliding Window)
```

### Definitions

| Tier       | Name         | Purpose                                                       | Example                |
| :--------- | :----------- | :------------------------------------------------------------ | :--------------------- |
| **Tier 1** | **Domain**   | Identifies the main professional discipline.                  | `Software Engineering` |
| **Tier 2** | **Topic**    | Broad subject area within the domain.                         | `Data Structures`      |
| **Tier 3** | **Subtopic** | Sub-division representing specific data shapes or techniques. | `Arrays`               |
| **Tier 4** | **Concept**  | The granular theory or algorithm tested in the question.      | `Sliding Window`       |

---

## 3. Concrete Example Map

Below is a trace of the taxonomy hierarchy for several core computer science topics:

### Data Structures

```
Software Engineering [Domain]
 └── Data Structures [Topic]
       └── Arrays & Hashing [Subtopic]
             ├── Traversal [Concept]
             ├── Prefix Sum [Concept]
             └── Sliding Window [Concept]
```

### System Design

```
Software Engineering [Domain]
 └── System Design [Topic]
       └── Distributed Systems [Subtopic]
             ├── Load Balancing [Concept]
             ├── Caching Strategies [Concept]
             └── Distributed Consensus [Concept]
```

---

## 4. Architectural Rules

1. **Strict Hierarchy:** No Concept can exist without a parent Subtopic, Topic, and Domain.
2. **Concept Granularity:** A Concept must represent a single, clear algorithmic method, model, or engineering trade-off. It should be small enough to be tested by 1–3 individual questions.
3. **No Overlaps:** A concept name must be unique within its parent Topic to avoid ambiguity during generation.
