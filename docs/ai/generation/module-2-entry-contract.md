# Module 2 Entry Contract

This document specifies the exact JSON entry contract consumed by the future Question Generation Engine (Module 2).

---

## 1. Specification Schema

The compilation output resolves to a single `GenerationBatch` payload.

```json
{
  "batchId": "string (UUID)",
  "blueprintId": "string (UUID)",
  "requests": [
    {
      "requestId": "string (UUID)",
      "blueprintId": "string (UUID)",
      "sectionId": "string (cuid/uuid)",
      "topicId": "string (uuid)",
      "conceptId": "string (uuid)",
      "difficulty": "EASY | MEDIUM | HARD",
      "templateId": "string (cuid/uuid)",
      "quantity": "number (integer >= 1)"
    }
  ]
}
```

---

## 2. Field Definitions

- **batchId**: Unique identifier generated dynamically per compile run to track the transaction.
- **blueprintId**: The source blueprint configuration identifier.
- **requests**: List of resolved generation tasks:
  - **requestId**: Unique transaction reference identifier per task.
  - **sectionId**: The target exam section.
  - **topicId**: The target topic.
  - **conceptId**: The specific concept mapped.
  - **difficulty**: Difficulty level constraint matching the template.
  - **templateId**: The database identifier of the selected question template.
  - **quantity**: The exact count of parameter-set instantiations required for this template.
