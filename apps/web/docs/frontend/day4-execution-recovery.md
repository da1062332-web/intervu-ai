# Day 4: Assessment Execution Recovery, Autosave & Submission

## Overview

This document outlines the architecture for preventing candidate data loss and managing the lifecycle of an assessment submission.

## State Management (`execution.store.ts`)

The execution store was extended to include non-domain UI status fields:

- `autosaveStatus`: `IDLE` | `SAVING` | `SAVED` | `FAILED`
- `connectionStatus`: `ONLINE` | `OFFLINE` | `RECONNECTING`
- `submissionStatus`: `IDLE` | `SUBMITTING` | `SUCCESS` | `FAILED`

Additionally, a `MARKED_FOR_REVIEW` state was added to track questions candidates wish to revisit.

## Features

### 1. Autosave (`useAutosave.ts`)

- Monitors changes to `answers`, `currentQuestionIndex`, and periodic 15-second intervals.
- Debounces save operations by 1 second.
- Updates `localStorage` immediately, creating a durable fallback before calling the API.
- Toggles the UI `AutosaveIndicator` in the header.

### 2. Connection Monitoring (`useConnectionMonitor.ts`)

- Subscribes to `window` `online`/`offline` events.
- Disables network-bound autosave and submission when offline.
- Triggers UI components (`ConnectionStatus`) to warn the candidate.

### 3. Recovery (`useResume.ts`)

- Triggered automatically on component mount in `ExecutionLayout`.
- Reads `localStorage` using the candidate's `testId`.
- Restores `answers`, `currentQuestionIndex`, `remainingTime`, and reconstructs the `palette` states.
- Displays a `ResumeBanner` notifying the user of recovery success.

### 4. Submission (`useSubmission.ts` & `SubmissionModal.tsx`)

- Triggered via the "Submit Assessment" button on the final question.
- Displays a modal summarizing Total, Answered, Unanswered, and Marked For Review questions.
- Requires explicit user confirmation.
- On success, clears `localStorage` to prevent future "stale" recoveries and redirects to `/candidate/results/[id]`.
