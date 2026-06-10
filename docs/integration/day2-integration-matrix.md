# Day 2 Integration Matrix

This matrix maps the flow from the Generation Engine through Storage and into the Test Start API, highlighting dependencies, contracts, and failure points.

## 1. Generation Engine

| Aspect | Detail |
| :--- | :--- |
| **Inputs** | `conceptKey`, `difficultyLevel`, `questionType` |
| **Outputs** | `question` DTO, `validation` DTO |
| **Dependencies** | LLM API, `zod` for validation |
| **Contracts** | Must follow structured generation constraints (e.g., options must be array of strings, exact correct answer match) |
| **Failure Points** | LLM Hallucinations, timeout, validation failure against Zod schema |

## 2. Storage & Question Pool

| Aspect | Detail |
| :--- | :--- |
| **Inputs** | `templateId`, `GeneratedQuestion` fields (hash, concept, difficulty, text, options) |
| **Outputs** | Persisted `GeneratedQuestion` |
| **Dependencies** | PostgreSQL (Prisma), `Template` table |
| **Contracts** | Unique `questionHash` prevents duplicate entries. |
| **Failure Points** | Duplicate hash (`P2002`), Database timeout, missing template reference. |

## 3. Test Start API (`POST /tests/start`)

| Aspect | Detail |
| :--- | :--- |
| **Inputs** | JWT Bearer Token, `testConfigId` |
| **Outputs** | `testInstanceId`, `status`, `instructionsUrl`, `durationSeconds` |
| **Dependencies** | Question Pool, TestConfig, User, JWT Auth |
| **Contracts** | Returns exact API Response wrapper: `{ success: true, data: {...}, error: null, meta: {} }` |
| **Failure Points** | Unauthorized, User ineligible, Pool empty for required section, Test Instance creation failure |
