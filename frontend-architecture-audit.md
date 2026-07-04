# Frontend Architecture Audit

## Overview
This audit evaluates the current frontend architecture to identify gaps before production release.

## Audit Areas

### 1. Folder Structure
**Status: FAIL**
- **Already completed work:** The project successfully utilizes Next.js App Router (`app/`), shared components (`components/ui/`), and global stores (`store/`).
- **Remaining gaps:** There is a major architectural inconsistency where business logic is split between two overlapping domain folders: `features/` and `modules/`. Both contain duplicate candidate domains.
- **Files requiring changes:**
  - Consolidate `features/candidate/dashboard` and `modules/candidate/pages/CandidateDashboard.tsx`.
  - Consolidate `features/candidate/execution` and `modules/candidate/pages/TestLaunchPage.tsx`.
  - Consolidate `features/candidate/results` and `modules/candidate/pages/CandidateReportPage.tsx`.

### 2. Naming Conventions
**Status: PARTIAL**
- **Already completed work:** Most React components follow PascalCase and utilities follow kebab-case or camelCase.
- **Remaining gaps:** Inconsistent store naming (e.g., `candidateDashboard.store.ts` vs `dashboard.store.ts`).

### 3. Shared Components
**Status: PARTIAL**
- **Already completed work:** A robust library of UI components exists in `components/ui`.
- **Remaining gaps:** Domain-specific folders recreate generic components (e.g., `modules/candidate/components/EmptyState.tsx` vs `components/ui/empty-state.tsx` or `components/empty-states/index.tsx`).

### 4. API Services
**Status: FAIL**
- **Already completed work:** Centralized API services exist in `services/api/`.
- **Remaining gaps:** API calls are duplicated across `services/api/`, `modules/*/services/`, and `features/*/services/`.
- **Files requiring changes:**
  - `services/api/dashboard.api.ts` vs `modules/candidate/services/dashboard.service.ts`.

### 5. Zustand Stores
**Status: FAIL**
- **Already completed work:** Global stores exist in `store/`.
- **Remaining gaps:** State management is fragmented. There are duplicate dashboard stores in different directories.
- **Files requiring changes:**
  - `store/dashboard.store.ts`
  - `modules/candidate/stores/dashboard.store.ts`
  - `features/candidate/dashboard/stores/candidateDashboard.store.ts`

### 6. React Query Hooks & Context Providers
**Status: PARTIAL**
- **Already completed work:** `providers/query-provider.tsx` is set up. Some features correctly utilize React Query (`services/exam-configs/hooks.ts`).
- **Remaining gaps:** Many components still handle data fetching manually instead of utilizing the React Query cache.

### Backend Blockers
- None identified directly for architecture, though duplicate API services need to be resolved to ensure they hit the correct final backend endpoints.

### Recommended Implementation Order
1. Merge `modules/candidate` and `features/candidate` into a single domain folder.
2. Deduplicate Zustand stores into single sources of truth.
3. Consolidate API services into the `services/` directory and refactor to use React Query hooks uniformly.
4. Replace ad-hoc UI components with `components/ui` implementations.
