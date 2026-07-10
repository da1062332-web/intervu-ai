# AI Generation Gap Analysis

## Executive Summary

This document provides a comprehensive audit of the existing AI implementation in the InterVu AI codebase and identifies the missing capabilities, reusable components, and required improvements to establish a structured, deterministic question generation pipeline using AI.

---

## 1. Existing AI Capabilities

The codebase currently contains a partial implementation of an AI question generation stack within the NestJS app (`apps/api/src/modules/generation-ai/`):

- **LLM Adapters (`LLMAdapter`, `OpenAIAdapter`, `MockAdapter`)**: An adapter-based integration for communicating with OpenAI's API (specifically `gpt-4o`) and a mock adapter for local testing and CI runs.
- **Basic Prompt Templates**: Hardcoded static prompts for `quantitative`, `verbal`, `logical`, and `coding` categories.
- **Retry and Audit Logs**: A `GenerationRetryService` that wraps generation calls in up to 3 retry attempts, logging each attempt and its audit details to the database (`GenerationAuditLog`).
- **Basic Validation**: Basic checks for topic alignment, difficulty validation, and duplication.
- **Queue/Job Manager**: Background job queuing (`GenerationJobService` and `BatchGenerationService`) utilizing `BullMQ`.

---

## 2. Missing Components & Gaps

To build the required structured question generation pipeline, the following critical gaps must be resolved:

| Feature / Requirement     | Current Implementation                                                                                          | Required Implementation                                                                                                                                                                                                                                      |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prompt Architecture**   | Hardcoded by category in static prompt files. Prompt has no awareness of the template definition.               | Dynamic `PromptBuilder` that builds the prompt sections (System, Context, Variables, Constraints, Structure, Option Strategy, Solution Logic, and Validation Rules) dynamically from database `Template` records.                                            |
| **Variable Injection**    | No variables are injected into the prompt. The LLM is asked to make up the question.                            | Variables and constraints from the `Template` variable schema must be resolved/hydrated or passed in the prompt context to guide the LLM to generate the exact instance.                                                                                     |
| **Option Generation**     | MCQ distractor options are hardcoded mock fallbacks: `["answer", "Incorrect A", "Incorrect B", "Incorrect C"]`. | Generate 4 plausible, context-relevant distractors directly from the LLM, and randomize the option order (shuffling) while retaining and matching the correct answer.                                                                                        |
| **Explanation Structure** | LLM is asked for a generic explanation text.                                                                    | Enforce a strict structure for explanations: `Concept` -> `Formula / Reasoning` -> `Step-by-Step Solution` -> `Final Answer`.                                                                                                                                |
| **Response Validation**   | Minimal field check using `class-validator` DTO.                                                                | High-fidelity validator (`ResponseValidator`) verifying: valid JSON, non-empty fields, exactly 1 correct answer matching one of the options, no duplicate options, no placeholder leakage (no unresolved `{var}` tokens), and template constraints matching. |
| **Preview Integration**   | Uses deterministic javascript hydration (`SolutionTemplateService.generatePreview`) rather than AI.             | Hook up the template preview endpoint `POST /templates/:id/preview` to run through the AI pipeline, returning a structured AI preview.                                                                                                                       |

---

## 3. Reusable Services & Components

The following modules and services can be directly reused or extended:

1.  **`LLM_ADAPTER` Injection**: The dynamic injection of `OpenAIAdapter` / `MockAdapter` based on environment configurations.
2.  **`TemplateLibraryService` / `Template` Model**: Reusing the database schema for templates, rules, and variables.
3.  **Auditing & Queue System**: `GenerationJobService` and `GenerationAuditService` can continue logging to the DB, but they must be updated to handle the new structured DTO format.
4.  **Prisma Models**: Reusing `Template`, `SolutionTemplate`, `TemplateVariable`, `TemplateRule`, `Question`, and `TemplatePreview` tables.

---

## 4. Required Improvements & Integration Dependencies

1.  **Refactor `GeneratedQuestionDto`**: Update the local DTO in `generation-ai` and the shared contracts package to match the sprint output:
    ```typescript
    export class GeneratedQuestionDto {
      question: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      difficulty: string;
      metadata: Record<string, any>;
    }
    ```
2.  **Modularize AI Services**: Create clean sub-services under `apps/api/src/modules/generation-ai/`:
    - `prompt/prompt-builder.service.ts`
    - `generators/question-generator.service.ts`
    - `generators/option-generator.service.ts`
    - `generators/explanation-generator.service.ts`
    - `validators/response-validator.service.ts`
3.  **Update Preview Flow**: Modify `SolutionTemplateService` in `template-library` to inject and call `GenerationRetryService` (or orchestrator) to run AI generation for real-time previews.

---

## 5. Certification & Testing Dependencies

- Create new unit test specs inside the `generation-ai` module:
  - `PromptBuilder.spec.ts`
  - `QuestionGenerator.spec.ts`
  - `OptionGenerator.spec.ts`
  - `ExplanationGenerator.spec.ts`
  - `ResponseValidator.spec.ts`
- Create new end-to-end integration tests under `tests/` or in the API integration suite:
  - `preview-generation.e2e.ts`
  - `question-generation.e2e.ts`
  - `template-generation.e2e.ts`
  - `ai-pipeline.e2e.ts`
