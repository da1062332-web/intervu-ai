# Day 3: Test Assembly Engine

## Architecture

The Test Assembly Engine converts a `Test Config` into an executable `Test Instance`.
It relies on a modular architecture:

- **AssemblyService**: Orchestrator controlling the data flow.
- **BlueprintBuilderService**: Parses configuration and defines structural needs.
- **QuestionAllocatorService**: Selects unique questions matching configurations.
- **SectionBuilderService**: Formats sections and structures final outputs.
- **AssemblyValidatorService**: Runs rigid validations over built assemblies.
- **AssemblyRepository**: Handles persistence within atomic Postgres transactions.

## Assembly Flow

1. API receives `configId`
2. Generate Blueprint from config rules
3. Allocate precise questions
4. Build fully realized sections (ordered)
5. Run AVL-001 through AVL-010 validations
6. Persist to Postgres within `$transaction`
7. Return `testInstanceId`

## Blueprint Logic

The blueprint outlines the constraints and structure without touching actual questions. It verifies the existence of the requested config and groups constraints logically per configured test section.

## Allocation Algorithm

Question allocation relies on the `QuestionPoolService`. It fetches specific questions based on `difficulty`, limits, and avoids fetching already `allocatedQuestionIds` globally.

## Difficulty Distribution

The allocator adheres to an input distribution mapping. By default:

- 40% EASY
- 40% MEDIUM
- 20% HARD
  It deterministically calculates rounding rules and selects from the pool.

## Duplicate Prevention

We use a global `allocatedQuestionIds` `Set<string>`. Any generated question pulled from the database goes through this set. If a duplicate exists, it fails assembly entirely.

## Validation Rules

The AssemblyValidator Service strictly checks:

- AVL-001: Total Question Count
- AVL-002: Section Count
- AVL-003: Question Allocation per section
- AVL-005: Duplicate Questions
- AVL-006: Section Duration
- AVL-007: Question Metadata
- AVL-008: Empty Sections
- AVL-009: Question Type Validation
- AVL-010: Assembly Completeness

## Persistence Flow

Everything is persisted using `Prisma $transaction` inside the `AssemblyRepository` for data integrity. The structure persists exactly as configured.

## API Contracts

**POST `/api/v1/assembly/build`**

- Body: `{ configId: string }`
- Response: `{ success: true, data: { testInstanceId: string } }`

**GET `/api/v1/assembly/:id`**

- Response: Fetches full assembly.

## Failure Scenarios

- `400 Bad Request`: Configuration not found, missing input data.
- `500 Internal Server Error`: Pool exhausted, allocation failures, validation failures.
