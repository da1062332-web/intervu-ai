# Generation Dependency Mapping

**Module:** Module 1.2.1 Topic Registry  
**Purpose:** Map the End-to-End Question Generation Flow  
**Version:** 1.0.0

---

## 1. Objective

This document explains the data lifecycle and dependencies in the InterVu AI platform. It traces how structured topics are combined with user configurations to create, validate, and assemble customized assessments.

---

## 2. Dependency Flow Diagram

The assessment pipeline relies on a cascading dependency chain. An upstream failure or missing schema definition in the early stages will destabilize the downstream generation engines:

```
+─────────────────────────+
| 1. Topic Registry       | (Single source of truth for all concepts & difficulty matrices)
+─────────────────────────+
             │
             ▼
+─────────────────────────+
| 2. Concept Mapping      | (Binds concepts to candidate job roles and skills profiles)
+─────────────────────────+
             │
             ▼
+─────────────────────────+
| 3. Difficulty Dist.     | (Filters concepts based on required Easy/Medium/Hard target mixes)
+─────────────────────────+
             │
             ▼
+─────────────────────────+
| 4. Question Gen. (AI)   | (Hydrates prompt contracts and generates matching questions)
+─────────────────────────+
             │
             ▼
+─────────────────────────+
| 5. Assembly Engine      | (Combines question pools into structured, timed assessments)
+─────────────────────────+
```

---

## 3. Detailed Data Flow Description

### 1. Topic Registry

- **Output:** A standardized dictionary of professional subjects, subtopics, and concepts along with their supported cognitive limits.
- **Role in Pipeline:** Acts as the foundation. All concepts selected or generated in later stages must exist in the Topic Registry.

### 2. Concept Mapping

- **Output:** A mapping database associating roles (e.g., "Frontend Engineer") with target concepts (e.g., "Sliding Window", "SOLID Principles").
- **Dependency:** Reads from the Topic Registry to ensure it only maps standard, valid concepts.

### 3. Difficulty Distribution

- **Output:** An exam blueprint specifying question count quotas partitioned by difficulty levels (e.g., 30% Easy, 50% Medium, 20% Hard).
- **Dependency:** Reconciles the required difficulty distribution with the Topic Registry's `difficultySupport` matrix, filtering out concepts that cannot be represented at the requested difficulty levels.

### 4. Question Generation (AI)

- **Output:** Hydrated prompt templates sent to the LLM (OpenAI/Gemini), returning concrete, validated questions.
- **Dependency:** Consumes the filtered concept list and uses it to construct structured system prompts. Validates the generated questions against the registry schema to check for tag alignment and metadata compatibility.

### 5. Assembly Engine

- **Output:** A compiled, ready-to-administer exam containing structured sections and candidate instructions.
- **Dependency:** Consumes the pools of validated questions produced by the generation engine and compiles them to match the exam's overall configuration limits.
