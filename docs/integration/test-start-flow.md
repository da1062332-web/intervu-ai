# Test Start Flow

This document details the HTTP sequence and internal service coordination for a candidate initiating an assessment via `POST /tests/start`.

```mermaid
sequenceDiagram
    participant Candidate
    participant API
    participant StartTestService
    participant EligibilityService
    participant TestConfigRepo
    participant QuestionPoolRepo
    participant TestInstanceRepo

    Candidate->>API: POST /tests/start (testConfigId) + JWT
    API->>StartTestService: startTest(userId, configId)
    StartTestService->>EligibilityService: validateEligibility()
    
    alt Ineligible
        EligibilityService-->>StartTestService: False
        StartTestService-->>API: 400 Bad Request
        API-->>Candidate: { success: false, error: ... }
    else Eligible
        StartTestService->>TestConfigRepo: findByIdWithSections(configId)
        TestConfigRepo-->>StartTestService: configData
        
        StartTestService->>QuestionPoolRepo: fetchRandomizedSet(sections)
        
        alt Pool Empty
            QuestionPoolRepo-->>StartTestService: QUESTION_POOL_EMPTY Error
            StartTestService-->>API: 500 Internal Server Error
            API-->>Candidate: { success: false, error: ... }
        else Questions Found
            QuestionPoolRepo-->>StartTestService: Questions[]
            StartTestService->>TestInstanceRepo: createTestInstance(sections, questions)
            TestInstanceRepo-->>StartTestService: testInstance
            StartTestService-->>API: Success Response DTO
            API-->>Candidate: { success: true, data: { testInstanceId, status, durationSeconds } }
        end
    end
```

## Error Scenarios Checked

1. **Unauthorized / Invalid Token**: Fails at `JwtAuthGuard` before reaching the controller.
2. **User Not Eligible**: `EligibilityService` denies access (e.g., test already taken).
3. **Invalid Config**: The `testConfigId` doesn't exist in the database.
4. **Insufficient Question Pool**: The database does not contain enough generated questions matching the config section criteria.
