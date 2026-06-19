# AI Generation Engine Contract

**Module:** Module 2.1 Generation Engine  
**Purpose:** Defines input and output specifications for the question generation pipeline.  
**Version:** 1.0.0

---

## 1. Input Specification

When triggering Module 2 to construct questions for a candidate test, it accepts a blueprint and style profile reference.

```json
{
  "blueprintId": "uuid-blueprint-12345",
  "styleProfileId": "uuid-style-profile-67890"
}
```

---

## 2. Output Specification

The engine processes the blueprint configurations, matches them with active templates and concept groups, applies candidate style profile constraints, and outputs a list of specific question generation requests:

```json
{
  "questionRequests": [
    {
      "sectionId": "sec-technical",
      "topicId": "se-ds-001",
      "concept": "Traversal",
      "difficulty": "medium",
      "templateKey": "tpl-binary-tree-traversal",
      "styleConstraints": {
        "questionLength": "short",
        "scenarioUsage": 0.1,
        "codeIntensity": 0.4,
        "complexity": "low"
      }
    },
    {
      "sectionId": "sec-technical",
      "topicId": "se-algo-001",
      "concept": "Binary Search",
      "difficulty": "medium",
      "templateKey": "tpl-binary-search-optimization",
      "styleConstraints": {
        "questionLength": "short",
        "scenarioUsage": 0.1,
        "codeIntensity": 0.4,
        "complexity": "low"
      }
    }
  ]
}
```

Each generation request is then processed deterministically by the LLM prompt generator.
