# Generation & Storage Flow

This document outlines the end-to-end process of generating questions via the AI Core and persisting them safely to the Question Pool, avoiding duplicates.

```mermaid
sequenceDiagram
    participant Template
    participant GenerationService
    participant Zod
    participant GeneratedQuestionRepo
    participant QuestionPoolRepo

    Template->>GenerationService: Pass conceptKey, difficulty, structure
    GenerationService->>GenerationService: Call LLM API (Prompt + Context)
    GenerationService->>Zod: Validate DTO (Required Fields, Format)
    
    alt Validation Failed
        Zod-->>GenerationService: Validation Error
        GenerationService-->>Template: Return Failure / Retry
    else Validation Passed
        Zod-->>GenerationService: Valid Question DTO
        GenerationService->>GeneratedQuestionRepo: create(questionHash, data)
        
        alt Duplicate Hash
            GeneratedQuestionRepo-->>GenerationService: Throw DUPLICATE_QUESTION_HASH
        else New Question
            GeneratedQuestionRepo-->>QuestionPoolRepo: Add to active Pool
            QuestionPoolRepo-->>GenerationService: Persisted!
        end
    end
```

## Flow Description

1. **Templates**: Supply the deterministic seed structure, including `conceptKey` and constraints.
2. **GenerationService**: Reaches out to the LLM backend to construct the question.
3. **DTO Validation**: Zod is used to immediately validate the output structure and verify that metadata matches requirements.
4. **Question Storage**: The `GeneratedQuestionRepository` hashes the question to ensure strict duplicate prevention (using Prisma's `P2002` error).
5. **Pool Management**: Questions successfully saved are immediately available in the `QuestionPoolRepository` for retrieval by test configs.
