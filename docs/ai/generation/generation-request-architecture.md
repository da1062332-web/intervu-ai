# Generation Request Architecture

This document maps the structural flow of compiling an exam configuration and blueprint into serialized question generation requests.

```
+------------------+
|   Exam Config    | (Total questions, sections structure, duration)
+------------------+
         |
         v
+------------------+
|    Blueprint     | (Style profile reference, sections JSON array)
+------------------+
         |
         v
+------------------+
|Section Allocation| (Question budget per section)
+------------------+
         |
         v
+------------------+
| Topic Allocation | (Largest Remainder Method distributes budget to topics)
+------------------+
         |
         v
+------------------+
|Difficulty Alloc. | (Topic totals split to Easy/Medium/Hard counts)
+------------------+
         |
         v
+------------------+
|Template Selection| (Prioritizes matches: Topic -> Concept -> Difficulty -> Type)
+------------------+
         |
         v
+------------------+
|Question Requests | (Generated list of template quantities & concepts)
+------------------+
```

## 1. Flow Breakdown

1. **Exam Config**: The starting context defining total questions budget (e.g. 30 questions) and durations.
2. **Blueprint**: Contains the sections JSON. Each section declares its allocated total questions, topic weightage percentages, difficulty distributions, and optional allowed template types.
3. **Section Allocation**: Extracts the question budget for each individual section.
4. **Topic Allocation**: Applies the Largest Remainder Method (LRM) to distribute the section's question count among assigned topics based on target percentages.
5. **Difficulty Allocation**: Applies LRM to divide each topic's question budget into EASY, MEDIUM, and HARD integer values based on section difficulty ratios.
6. **Template Selection**: Filters and matches active, valid database templates to the topic's active concepts and difficulty levels. It prioritizes allowed template types and sorts alphabetically for complete determinism.
7. **Question Requests**: Serializes the matched templates and quantities into discrete `GenerationRequest` contracts.

---

## 2. Compilation Rules

* **Stateless**: The compiler operates completely in-memory, resolving templates dynamically.
* **Deterministic**: All sorting, rounding, and tie-breaking algorithms are mathematical and stable.
* **Gate Check**: Compilation is blocked if the exam configuration readiness report is not `READY`.
