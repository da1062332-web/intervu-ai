# Published Snapshot Flow (Assessment Generation)

Summary

- The API now prefers returning a `PUBLISHED` assembled test snapshot for a blueprint when available.
- The `TestAssemblyService.generateQuestions` checks `AssembledTestRepository.findByConfigId(blueprintId)` and returns the snapshot synchronously if found.

Frontend

- The Assessment Builder UI now displays a `Published Snapshot` badge when the returned assessment has `status: 'PUBLISHED'`.

Behavioral notes

- If a `PUBLISHED` snapshot exists for the requested `blueprintId`, no generation job is enqueued and the frontend receives the snapshot immediately.
- If no published snapshot exists, the existing queue-based generation flow is used (queue job is enqueued and polled).

Developer notes

- Unit test added: `apps/api/src/modules/test-assembly/services/test-assembly.service.spec.ts` validates synchronous returned snapshot.
- Worker generation was updated to prefer DB-sourced `prisma.question` entries when available (see `apps/worker/src/services/ai.service.ts`).

Testing

- Build and run API + worker, then open Assessment Builder and generate an assessment for a blueprint that has a published assembled test. The UI should show the `Published Snapshot` badge and display questions immediately.
