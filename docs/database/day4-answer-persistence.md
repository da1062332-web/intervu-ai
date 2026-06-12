# Day 4: Execution Persistence & Autosave Infrastructure

## Overview

This document outlines the architecture for Day 4 Execution Persistence, tracking the candidate's heartbeat state and autosaving answers in real-time.

## Schema Additions

The database schema has been extended with three new core entities, strictly related to `TestInstance`.

### `CandidateAnswer`

Stores individual answers.

- **`questionId` Relationship:** This exact string references `TestInstanceQuestion.questionId` (which originally maps to `GeneratedQuestion.id`). The Next.js frontend utilizes `question.id` (which maps back to the generated ID) for its execution array. This string serves as the composite key to guarantee 1 answer per instantiated question.
- **`timeSpentSeconds`**: Micro-tracking of answer latency.

### `ExecutionState`

A single 1-to-1 heartbeat record per `TestInstance`.

- Constantly tracks `currentQuestionIndex` and `remainingTimeSeconds`.

### `Submission`

The locking mechanism.

- Created lazily via `SubmissionStatus.PENDING`.
- Once toggled to `SUBMITTED`, all subsequent writes to the repository are immediately blocked by throwing `ANSWER_MODIFICATION_NOT_ALLOWED`.

## Transaction Strategy

All standard autosaves trigger the `ExecutionPersistenceRepository.saveAnswerAndState` method. This method builds a completely flat `prisma.$transaction([])` array combining the answer upsert and state upsert. Because they are not deeply nested, Prisma executes this as a single atomic batch statement, drastically reducing network latency and guaranteeing we can save 40+ answers synchronously under 1.0 seconds.
