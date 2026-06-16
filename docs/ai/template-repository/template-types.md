# Template Classification Specification

**Module:** 1.3.1 Template Repository  
**Objective:** Define categories of question templates, input variables, and output structures.  
**Version:** 1.0.0

---

## 1. Overview

This document specifies the supported question categories for the InterVu AI template library. By categorizing templates, we enable the generation engine to enforce type-specific prompts, schemas, and UI renderings.

---

## 2. Template Categories

### 1. Multiple Choice Question (MCQ)

- **Purpose:** Assess single-answer recall, concept comprehension, and basic analytical skills.
- **Input Variables:**
  - `{SUBJECT}`: The entity/topic under test (e.g., `"Garbage Collection"`).
  - `{CONDITION}`: The specific scenario/context (e.g., `"when memory runs low"`).
- **Output Structure:**
  - `questionText`: String asking a question.
  - `options`: String array containing exactly 4 items.
  - `correctAnswer`: String exactly matching one of the options.
  - `explanation`: String describing why the option is correct.

### 2. Multiple Select

- **Purpose:** Evaluate multi-faceted knowledge or scenario analysis where multiple choices apply.
- **Input Variables:**
  - `{SCENARIO}`: The setup (e.g., `"microservices architecture communicating asynchronously"`).
  - `{CRITERIA}`: The target condition (e.g., `"improving fault tolerance"`).
- **Output Structure:**
  - `questionText`: String indicating that multiple options can be correct.
  - `options`: String array of 4-6 choices.
  - `correctAnswer`: Comma-separated list or JSON array of correct options.
  - `explanation`: String detailing the correctness of each option.

### 3. True/False

- **Purpose:** Quick confirmation of factual knowledge, rules, or core concepts.
- **Input Variables:**
  - `{STATEMENT}`: A factual or conceptual assertion (e.g., `"REST APIs are fundamentally stateful"`).
- **Output Structure:**
  - `questionText`: String stating the claim.
  - `options`: String array containing `["True", "False"]`.
  - `correctAnswer`: `"True"` or `"False"`.
  - `explanation`: Explanation justifying the fact.

### 4. Fill in the Blank

- **Purpose:** Verify knowledge of precise terminology, keywords, or method names.
- **Input Variables:**
  - `{CODE_SNIPPET}`: A snippet containing a placeholder `{BLANK}`.
  - `{CONCEPT}`: The target keyword/mechanism.
- **Output Structure:**
  - `questionText`: Text containing a blank indicator (e.g., `____` or `[blank]`).
  - `correctAnswer`: The exact string needed to fill the blank.
  - `explanation`: Explanation of the function or keyword.

### 5. Code Output

- **Purpose:** Test code comprehension, state tracing, and algorithmic execution.
- **Input Variables:**
  - `{CODE_SNIPPET}`: Code containing logic, control flows, and variables.
  - `{INPUT_PARAMS}`: Input values passed to the code snippet.
- **Output Structure:**
  - `questionText`: _"What is the console output of the following code snippet?"_
  - `options`: 4 possible string outputs.
  - `correctAnswer`: The exact execution output.
  - `explanation`: Line-by-line tracing of variable states.
- **Note:** This category also covers **SQL/Query Output** questions (predicting query results).

### 6. Debugging

- **Purpose:** Assess troubleshooting, syntax verification, and logical error identification.
- **Input Variables:**
  - `{BUGGY_CODE}`: Snippet containing a single compilation or runtime defect.
  - `{ERROR_BEHAVIOR}`: What happens when run (e.g. infinite loop, stack overflow).
- **Output Structure:**
  - `questionText`: Code block accompanied by a description of the failure.
  - `options`: Options describing the line number and fix.
  - `correctAnswer`: The correct diagnostic/remediation choice.
  - `explanation`: Description of the bug and why the fix works.
- **Note:** This category also covers **Code Refactoring** questions targeting performance optimizations or code smells.

### 7. Scenario Based

- **Purpose:** Evaluate practical, real-world decision-making and software engineering trade-offs.
- **Input Variables:**
  - `{CONTEXT}`: Business or technical problem statement.
  - `{CONSTRAINTS}`: Resource limitations (e.g. latency limit, budget).
- **Output Structure:**
  - `questionText`: Detailed description of a developer problem.
  - `options`: Four structural/algorithmic options.
  - `correctAnswer`: The optimal trade-off answer.
  - `explanation`: Architectural rationale explaining the choice.
- **Note:** This category covers **System Design / Architecture** questions targeting specific design patterns, caching, database replication, or queue integrations.

### 8. Case Study

- **Purpose:** Deep evaluation of multi-layered system design, business integration, or migration paths.
- **Input Variables:**
  - `{CASE_STUDY_DESCRIPTION}`: Large textual description of a system, its components, issues, and growth plans.
- **Output Structure:**
  - `questionText`: Extensive case context.
  - `options`: Complex options assessing systemic improvements.
  - `correctAnswer`: The correct high-level planning choice.
  - `explanation`: Rationale mapping the choice to the overall system constraints.
