# Difficulty Blueprint Framework

**Module:** Module 1.4.2 Difficulty Blueprint Framework  
**Purpose:** Defines the conceptual hierarchy controlling question layout.  
**Version:** 1.0.0

---

## The Allocation Hierarchy

To ensure structured, high-quality, and cost-controlled question generation, the system routes choices through the following deterministic blueprint pipeline:

```
Exam Config (The base assessment configuration metadata)
    ↓
Section (A partitioned segment of the exam, e.g. Aptitude, Technical)
    ↓
Topic (Allocated percentage representation, e.g. Data Structures = 60%, Algorithms = 40%)
    ↓
Concept (Granular concept mapping loaded from registry, e.g. Arrays, Sliding Window)
    ↓
Difficulty (Section-level difficulty distribution percentages)
    ↓
Template (Selects matching templates from the library)
```

---

## Architectural Rules

1. **Deterministic Distributions:** Every blueprint section must have a total topic percentage sum of exactly `100%`.
2. **Standard Difficulty Tiers:** Section difficulty mixes (`easy + medium + hard`) must equal exactly `100%`.
3. **Registry Conformance:** Mapped topics must exist in the system Topic Registry.
4. **Guaranteed Solvability:** A blueprint cannot be saved or run if matching active templates for the requested topic and difficulty levels do not exist in the Template Library.
