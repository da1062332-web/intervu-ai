# Frontend Performance Report

## Overview

This report analyzes the performance bottlenecks and optimization gaps in the frontend application.

## Audit Areas

### 1. React.memo, useMemo, useCallback

**Status: FAIL**

- **Already completed work:** Some analytics charts and execution tables utilize `React.memo` (e.g., `modules/candidate/components/analytics/ScoreTrendChart.tsx`).
- **Remaining gaps:** Throughout the codebase, only ~12 files use `React.memo`, ~7 files use `useMemo`, and ~7 files use `useCallback`. This indicates a severe lack of memoization, which will cause unnecessary re-renders in large lists and complex dashboards (like Candidate Dashboard or Assembly tables).
- **Files requiring changes:**
  - Heavy data tables in `modules/candidate/components/AttemptHistoryTable.tsx` and `features/topic-section-mapping/components/TopicMappingTable.tsx`.
  - Dashboard parent components passing inline functions to children.

### 2. Dynamic Imports & Route Splitting

**Status: FAIL**

- **Already completed work:** Next.js App Router naturally splits code by route.
- **Remaining gaps:** `next/dynamic` is only used in `providers/query-provider.tsx`. Heavy components (like modals, charts, and rich text editors in exam config) are loaded eagerly, bloating the initial bundle size.
- **Files requiring changes:**
  - Lazy load all modals in `app/admin/blueprints/components/` and `features/admin/configs/components/`.
  - Lazy load charts in `components/admin/analytics/` and `components/assembly/`.

### 3. Images Optimization

**Status: FAIL**

- **Already completed work:** None.
- **Remaining gaps:** Zero usage of `next/image` in the entire codebase. Standard `<img>` tags are likely being used, which skips Next.js image optimization (WebP conversion, lazy loading, responsive sizing).
- **Files requiring changes:**
  - Any component rendering candidate avatars, logos (e.g., `components/ui/logo.tsx`), or placeholders.

### Backend Blockers

- If backend API endpoints lack pagination or filtering for large datasets (e.g., attempt history), frontend rendering will suffer regardless of memoization.

### Recommended Implementation Order

1. Replace all `<img>` tags with `next/image`.
2. Apply `next/dynamic` to all heavy, non-critical components (modals, charts below the fold).
3. Implement `useMemo` for expensive data transformations in analytics and dashboard pages.
4. Apply `useCallback` to event handlers passed down to complex child components or tables.
