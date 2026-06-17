# Template Type Registry

**Module:** 1.3.1 Template Repository  
**Objective:** Catalog the supported question types, variable requirements, and target outputs.  
**Version:** 1.0.0

---

## 1. Supported Question Types

This registry specifies the 8 canonical question formats supported by the InterVu AI template library. Every template registered must match one of these types:

---

## 2. Type Catalog

### 1. Multiple Choice Question (MCQ)

- **Purpose:** Evaluate fact recall, concept comprehension, and basic analytical skills.
- **Input Variables:**
  - `{SUBJECT}`: The entity/topic under test (e.g., `"Garbage Collection"`).
  - `{CONDITION}`: The specific scenario/context (e.g., `"when memory runs low"`).
- **Expected Output:**
  - `questionText`: String asking a question.
  - `options`: String array containing exactly 4 options.
  - `correctAnswer`: String exactly matching one of the options.
  - `explanation`: String describing why the selected option is correct.

### 2. Multiple Select

- **Purpose:** Assess complex, multi-layered situations where more than one choice may be correct.
- **Input Variables:**
  - `{SCENARIO}`: The setup (e.g., `"microservices architecture communicating asynchronously"`).
  - `{CRITERIA}`: The target condition (e.g., `"improving fault tolerance"`).
- **Expected Output:**
  - `questionText`: String indicating that multiple options can be correct.
  - `options`: String array of 4-6 choices.
  - `correctAnswer`: Comma-separated list or JSON array of correct options.
  - `explanation`: String detailing the correctness of each option.

### 3. True / False

- **Purpose:** Quick verification of conceptual definitions, facts, or system rules.
- **Input Variables:**
  - `{STATEMENT}`: A factual or conceptual assertion (e.g., `"REST APIs are fundamentally stateful"`).
- **Expected Output:**
  - `questionText`: String stating the claim.
  - `options`: String array containing exactly `["True", "False"]`.
  - `correctAnswer`: `"True"` or `"False"`.
  - `explanation`: Explanation justifying the fact.

### 4. Fill in Blank

- **Purpose:** Test knowledge of precise programming keywords, method names, or terminology.
- **Input Variables:**
  - `{CODE_SNIPPET}`: A snippet containing a placeholder `{BLANK}`.
  - `{CONCEPT}`: The target keyword/mechanism.
- **Expected Output:**
  - `questionText`: Text containing a blank indicator (e.g., `____` or `[blank]`).
  - `correctAnswer`: The exact string needed to fill the blank.
  - `explanation`: Explanation of the function or keyword.

### 5. Code Output

- **Purpose:** Test code comprehension, state tracing, and algorithmic execution.
- **Input Variables:**
  - `{CODE_SNIPPET}`: Code containing logic, control flows, and variables.
  - `{INPUT_PARAMS}`: Input values passed to the code snippet.
- **Expected Output:**
  - `questionText`: _"What is the console output of the following code snippet?"_
  - `options`: 4 possible string outputs.
  - `correctAnswer`: The exact execution output.
  - `explanation`: Line-by-line tracing of variable states.

### 6. Debugging

- **Purpose:** Verify troubleshooting, error diagnostic, and syntax fixing capabilities.
- **Input Variables:**
  - `{BUGGY_CODE}`: Snippet containing a single compilation or runtime defect.
  - `{ERROR_BEHAVIOR}`: What happens when run (e.g. infinite loop, stack overflow).
- **Expected Output:**
  - `questionText`: Code block accompanied by a description of the failure.
  - `options`: Options describing the line number and fix.
  - `correctAnswer`: The correct diagnostic/remediation choice.
  - `explanation`: Description of the bug and why the fix works.

### 7. Scenario Based

- **Purpose:** Evaluate practical decision-making and software engineering trade-offs under constraints.
- **Input Variables:**
  - `{CONTEXT}`: Business or technical problem statement.
  - `{CONSTRAINTS}`: Resource limitations (e.g. latency limit, budget).
- **Expected Output:**
  - `questionText`: Detailed description of a developer problem.
  - `options`: Four structural/algorithmic options.
  - `correctAnswer`: The optimal trade-off answer.
  - `explanation`: Architectural rationale explaining the choice.

### 8. Case Study

- **Purpose:** Evaluate deep, systematic understanding of high-level architecture, migrations, or failure analysis.
- **Input Variables:**
  - `{CASE_STUDY_DESCRIPTION}`: Large textual description of a system, its components, issues, and growth plans.
- **Expected Output:**
  - `questionText`: Extensive case context.
  - `options`: Complex options assessing systemic improvements.
  - `correctAnswer`: The correct high-level planning choice.
  - `explanation`: Rationale mapping the choice to the overall system constraints.
