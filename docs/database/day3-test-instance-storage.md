# Day 3: Test Instance Persistence & Assembly Foundation

## Overview
This document outlines the architecture for the Module 3 Test Assembly Engine persistence layer. The database must persistently represent an entire assembled test, enabling workflows like execution, resuming, auto-saving, and final submission.

## Architecture & Relationships

We have explicitly retained the legacy `Test` table for backwards compatibility (Day 1 dashboards). The new MVP relies solely on the `TestInstance` tree.

```mermaid
erDiagram
    TestInstance {
        String id PK
        String userId FK
        String testConfigId FK
        TestInstanceStatus status
        DateTime startedAt
        DateTime expiresAt
        DateTime submittedAt
    }
    TestInstanceSection {
        String id PK
        String testInstanceId FK
        String sectionKey
        String sectionName
        Int durationSeconds
        Int questionCount
        Int orderIndex
    }
    TestInstanceQuestion {
        String id PK
        String testInstanceId FK
        String sectionId FK
        String questionId
        Int questionOrder
        Json questionSnapshot
    }

    User ||--o{ TestInstance : takes
    TestConfig ||--o{ TestInstance : defines
    TestInstance ||--|{ TestInstanceSection : contains
    TestInstanceSection ||--|{ TestInstanceQuestion : contains
    TestInstance ||--|{ TestInstanceQuestion : "flattens"
```

## Immutable Snapshot Strategy

The `TestInstanceQuestion.questionSnapshot` field guarantees that the exact state of the question at the time of assembly is frozen. 
- Execution **must never** query the Question Pool table (`GeneratedQuestion`).
- If a source question is edited in the future, the in-flight candidate tests remain 100% unaffected.

## Transaction Assembly Flow

The `AssemblyRepository` uses a strict `prisma.$transaction()` flow to guarantee absolute integrity.

```mermaid
sequenceDiagram
    participant AssemblyEngine
    participant AssemblyRepository
    participant Database

    AssemblyEngine->>AssemblyRepository: persistAssembly(instance, sections, questions)
    AssemblyRepository->>Database: BEGIN TRANSACTION
    
    AssemblyRepository->>Database: CREATE TestInstance
    loop For Each Section
        AssemblyRepository->>Database: CREATE TestInstanceSection
        AssemblyRepository->>Database: CREATE MANY TestInstanceQuestion
    end

    alt Success
        Database-->>AssemblyRepository: COMMIT
        AssemblyRepository-->>AssemblyEngine: Full Assembly Data
    else Failure
        Database-->>AssemblyRepository: ROLLBACK
        AssemblyRepository-->>AssemblyEngine: Error
    end
```

## Assembly Read Model

A dedicated `getAssemblyData()` method fetches the fully nested structure in one highly-optimized query. This prevents N+1 query problems and serves as the single entrypoint for the Day 4 Execution Engine to initialize candidate browsers.
