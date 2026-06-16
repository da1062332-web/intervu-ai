# PR Implementation Checklist

Developers must copy, complete, and include this checklist in their PR description before requesting a merge review. All checks must pass.

---

## Checklist Sections

### 1. Contract Check

- [ ] Shared DTO types are imported from `@intervu/contracts` (no local duplication of types).
- [ ] All field names, cases, and types match the API contract exactly.
- [ ] Input validations are strictly defined and validated using Zod.

### 2. Database Check

- [ ] No direct queries to the database from the service layer; Repository Pattern is strictly used.
- [ ] Table structures, keys, and indexes match the Database Architecture blueprint.
- [ ] Database migration files have been generated via Prisma and committed.

### 3. API Check

- [ ] API routes are versioned under `/api/v1/`.
- [ ] Successful responses are wrapped in the standard envelope `{ success, data, error, meta }`.
- [ ] Error scenarios throw standard exceptions and are caught by the GlobalExceptionFilter.

### 4. Frontend Check

- [ ] API calls are fully isolated in hooks or services; no direct `fetch` inside UI components.
- [ ] Component rendering handles loading, empty, and error states gracefully.
- [ ] Router configuration and page routes are correctly mapped.

### 5. Testing & Validation Check

- [ ] Local API `.env` file includes `OPENAI_API_KEY=sk-dummy-key-for-local-development` for environment validation.
- [ ] The local codebase passes the complete validation suite with zero errors:
  - `npm run format`
  - `npm run lint:fix`
  - `npm run lint`
  - `npm run check:structure`
  - `npm run type-check`
  - `npm run build`
  - `npm run test`
  - `npm run test:integration`
  - `npm run test:contracts`
  - `npm run test:regression`

### 6. Documentation Check

- [ ] Added or modified endpoints/tables are updated in `api-db-mapping.md` and `frontend-backend-mapping.md`.
- [ ] Code comments and docstrings are preserved and updated where necessary.
