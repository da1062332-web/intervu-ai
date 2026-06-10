# Day 3 Integration Matrix

This document maps all Day 3 architectural components, detailing their owners, input and output boundaries, validation schemas, and subsystem responsibilities.

| Component Name | Epic / Feature | Owner | Key Input | Key Output | Contract / Schema |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Validation Engine** | Question Validation & QA | Developer 1 (AI) | `GeneratedQuestionDto` | `QuestionValidationDto` | `QuestionValidationSchema` (Zod) |
| **Persistence Layer** | Test Session Persistence | Developer 2 (BE) | `TestInstanceCreateInput` | Database Records / Prisma Entities | `TestInstance` / `TestSection` / `TestInstanceQuestion` (Prisma) |
| **Execution UI** | Candidate Attempt Panel | Developer 3 (FE) | `CandidateQuestionDto` / Navigation Context | User actions / Submitted Answers | `SubmitExecutionDto` (Zod) |
| **Assembly Engine** | Test Section & Question Selection | Developer 4 (BE) | `TestConfig` / Selected Pool Questions | Combined Test Structure / Test Instance | `TestConfigSchema` / `TestInstanceSchema` |

---

## Component Boundaries and Responsibilities

### 1. Validation Engine (Developer 1)
- **Primary Role**: Act as the gatekeeper for question quality.
- **Contract Enforcement**: Consumes raw generated question properties and computes score metrics out of 100.
- **Rules Config**: Uses `VALIDATION_RULES` registry.
- **Integrations**: Integrates with the generation engine to validate questions prior to pool ingestion, and with the assembly engine to audit pooled questions during allocation.

### 2. Persistence Layer (Developer 2)
- **Primary Role**: Safely store test sections, snapshot allocated questions, and persist candidate attempts.
- **Contract Enforcement**: Enforces transactions so that a `TestInstance` is never saved in a half-created or corrupt state.
- **Integrations**: Consumes the structured output of the Assembly Engine and persists it in PostgreSQL/Redis database structures.

### 3. Execution UI (Developer 3)
- **Primary Role**: Render the assessment layout (timer, question content, pagination, and question navigator palette).
- **Contract Enforcement**: Consumes `CandidateQuestionDto` (which strips answers/solutions to prevent candidate-side leakage) and returns `SubmitExecutionDto`.
- **Integrations**: Retrieves active sessions from the Persistence Layer and dispatches candidate answer submissions to the execution services.

### 4. Assembly Engine (Developer 4)
- **Primary Role**: Construct test sections and load randomized pool questions satisfying blueprint counts.
- **Contract Enforcement**: Ensures no duplicate questions are allocated across sections, and prevents candidate question repetition.
- **Integrations**: Links test configs to generated questions, validates allocations against the Validation Engine, and passes assembled schemas to the Persistence Layer.
