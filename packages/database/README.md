# InterVu AI - Database Standards & Guidelines

This package (`@intervu-ai/database`) manages the PostgreSQL database schema, migrations, data seeding, and database access clients.

---

## 1. Naming Conventions

To keep schema designs clean, consistent, and predictable, we adhere to the following naming conventions:

### Models & Tables

- **PascalCase & Singular**: All Prisma models must be singular PascalCase (e.g. `User`, `Session`, `Template`, `Test`).
- **Relations**: Relationship fields pointing to arrays should be plural camelCase (e.g. `sessions Session[]`). Relationship fields pointing to a single model should be singular camelCase (e.g. `user User`).

### Fields & Columns

- **camelCase**: All model fields/columns must be camelCase (e.g. `passwordHash`, `ipAddress`, `startedAt`).
- **Foreign Keys**: Foreign keys must match the pattern `[relationName]Id` (e.g. `userId`, `templateId`).
- **Audit Fields**: Every soft-deletable or trackable model should standardise on:
  - `createdAt DateTime @default(now())`
  - `updatedAt DateTime @updatedAt`
  - `deletedAt DateTime?`

### Indexes & Constraints

- **Explicit Naming**: Let Prisma auto-name standard constraints, but always place explicit `@@index` annotations on:
  - Foreign Keys (e.g. `@@index([userId])`)
  - Soft-delete flags (e.g. `@@index([deletedAt])`)
  - Filter columns used in high-frequency queries (e.g. `@@index([status])`, `@@index([role])`)

---

## 2. Migration Workflow

All database schema modifications must be applied using Prisma Migrations. Never alter tables manually in production or development.

### Step 1: Modify the Schema

Update the model definitions inside [schema.prisma](file:///e:/Company/Qloax/InterviAI/intervu-ai/packages/database/prisma/schema.prisma).

### Step 2: Create and Apply Dev Migration

Generate the migration SQL file and apply it to your local database:

```bash
# From workspace root
npx prisma migrate dev --name <migration_description> --schema packages/database/prisma/schema.prisma
```

This will:

1. Generate a migration SQL folder in `packages/database/prisma/migrations/`.
2. Apply it to the active `DATABASE_URL` target.
3. Automatically regenerate the Prisma Client types.

### Step 3: Run Database Seeds (If Applicable)

If database tables need baseline data or configs populated, run the seed script:

```bash
npx prisma db seed --schema packages/database/prisma/schema.prisma
```

---

## 3. Repository Standards

Our application layers strictly enforce the **Repository Pattern**. Direct database calls inside controllers or services are forbidden.

### Base Repository Structure

All repositories must extend [BaseRepository](file:///e:/Company/Qloax/InterviAI/intervu-ai/apps/api/src/common/repositories/base.repository.ts) to share baseline CRUD logic:

```typescript
export abstract class BaseRepository<
  T extends { id: string; deletedAt?: Date | null },
  CreateInput,
  UpdateInput,
>
```

### Key Coding Rules for Repositories

1. **No `any` Types**: Ensure strict TypeScript parameter and return typing.
2. **Transaction Propagation**:
   All database access inside repository methods must run on `this.db` (which routes query calls through the transactional client when inside a transaction scope) instead of the global `this.prisma` instance:
   ```typescript
   // Correct
   return this.db.user.findMany({ ... });
   ```
3. **Query Batching in Pagination**:
   Implement paginated lookups concurrently using `Promise.all` to fetch items and compute total records in parallel, preventing database execution stalls:
   ```typescript
   const [items, total] = await Promise.all([
     this.model.findMany({ take, skip }),
     this.model.count(),
   ]);
   ```
4. **Soft Delete Handling**:
   - For soft-deletable models, configure the repository option `{ softDelete: true }` in the super constructor call.
   - Soft deletes map the `delete(id)` action to a column update setting `deletedAt = new Date()`.
   - All read operations must automatically filter out records where `deletedAt != null`.
