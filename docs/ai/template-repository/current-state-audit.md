# Current State Audit - Template Library

**Module:** 1.3.1 Template Repository  
**Objective:** Audit the existing codebase to document models, APIs, limitations, and MVP gaps.  
**Version:** 1.0.0

---

## 1. Current Database Models

The current schema defined in [schema.prisma](file:///c:/code/intervu-ai/packages/database/prisma/schema.prisma) represents a hybrid structure containing both legacy and newer, unintegrated columns in the `Template` model:

### `Template` Model

```prisma
model Template {
  id              String          @id @default(cuid())
  templateKey     String          @unique @default(cuid())
  conceptKey      String          @default("default_concept")
  difficultyLevel DifficultyLevel @default(MEDIUM)
  questionType    String          @default("multiple_choice")
  structure       Json            @default("{}")
  variableSchema  Json            @default("{}")
  constraints     Json            @default("{}")
  solutionSchema  Json            @default("{}")
  version         Int             @default(1)
  isActive        Boolean         @default(true)

  name        String          @default("Legacy Template")
  description String?
  difficulty  DifficultyLevel @default(MEDIUM)
  config      Json            @default("{}")
  isSystem    Boolean         @default(false)
  creatorId   String?

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  creator            User?               @relation(fields: [creatorId], references: [id], onDelete: SetNull)
  tests              Test[]
  generatedQuestions GeneratedQuestion[]
}
```

---

## 2. Current APIs

The template controller [template.controller.ts](file:///c:/code/intervu-ai/apps/api/src/modules/template-library/controllers/template.controller.ts) exposes the following REST endpoints:

- `GET /templates` - Paginated lists of templates, with support for filtering by `difficulty`.
- `GET /templates/system` - Lists system-managed templates.
- `GET /templates/difficulty/:level` - Filters templates by difficulty level.
- `GET /templates/:id` - Retrieves a single template by ID.
- `GET /templates/:id/version` - Retrieves the template version token (currently mocked using the `updatedAt` ISO timestamp).
- `POST /templates` - Creates a new template.
- `PATCH /templates/:id` - Updates an existing template.
- `DELETE /templates/:id` - Soft-deletes a template by ID.

---

## 3. Current Limitations

1.  **Redundant Fields:** The database schema has duplicate fields, such as `templateKey` vs `id`, `difficulty` vs `difficultyLevel`, and `isActive` vs soft delete status, which can cause state synchronization bugs.
2.  **No True Versioning:** The `version` field is just an integer that defaults to 1. The `getVersion` API returns `updatedAt.toISOString()` as a mock token. There is no historical storage of past revisions.
3.  **No Rollback System:** Since past revisions of templates are overwritten during updates, there is no way to perform a rollback to a prior state.
4.  **Mocked Caching & Invalidation:** Services use Redis cache, but cache keys and invalidation parameters do not match structural changes.

---

## 4. MVP Gaps

The following core MVP requirements are completely missing or unimplemented in the current codebase:

| Feature / Contract          | Status in Codebase | Action Required                                                                  |
| :-------------------------- | :----------------- | :------------------------------------------------------------------------------- |
| **Topic registry matching** | Missing            | Need to link templates to the Topic Registry `topicId`.                          |
| **Strict Variable Schemas** | Partial            | Existing `variableSchema` accepts any JSON. Needs strict TypeScript contracts.   |
| **Template Validation**     | Missing            | Need Zod checks matching placeholders in `templateText` to `variableSchema`.     |
| **Version Snapshots**       | Missing            | A `TemplateVersion` table is needed to store immutable snapshots.                |
| **Rollback Design**         | Missing            | No rollback endpoints or state restoration logic exists.                         |
| **Seed Templates**          | Partial            | Exist in `/generation/templates` but are missing the `true-false.json` category. |
| **Selection Rules**         | Missing            | No deterministic selection using PRNG seeds in the generation engine.            |
| **Quality Framework**       | Missing            | No automated rejection checks for generated outputs.                             |
