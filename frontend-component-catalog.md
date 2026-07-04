# Frontend Component Catalog

## Overview
Audit of the shared component library to identify duplication and consolidation opportunities.

## Audit Areas

### 1. Core UI Components (`components/ui/`)
**Status: PASS**
- **Already completed work:** A robust foundational set of components is present: `avatar`, `badge`, `button`, `card`, `checkbox`, `dropdown-menu`, `input`, `label`, `loading`, `modal`, `progress`, `radio-group`, `separator`, `sheet`, `skeleton`, `switch`, `table`, `tooltip`.

### 2. Duplicate Components
**Status: FAIL**
- **Remaining gaps:** Ad-hoc components in feature modules that duplicate core UI components.
- **Files requiring changes:**
  - **Empty States:** `components/ui/empty-state.tsx` and `components/empty-states/index.tsx` are duplicated by `modules/candidate/components/EmptyState.tsx`, `components/admin/analytics/EmptyAnalyticsState.tsx`, and `components/admin/results/EmptyResults.tsx`.
  - **Skeletons:** `components/ui/skeleton.tsx` is duplicated by `components/admin/analytics/SkeletonChart.tsx`, `components/admin/dashboard/skeleton-card.tsx`, `features/candidate/execution/components/ExecutionSkeleton.tsx`, and `features/candidate/results/components/ResultsSkeleton.tsx`.
  - **Modals:** Custom modal implementations exist instead of extending `components/ui/modal.tsx`:
    - `app/admin/blueprints/components/AddTopicModal.tsx`
    - `features/admin/configs/components/concept-mapping/ConceptFormModal.tsx`
    - `modules/exam-config/components/section-builder/SectionFormModal.tsx`
  - **Tables:** Disconnected table implementations instead of utilizing `components/ui/table.tsx`:
    - `components/admin/config/config-table.tsx`
    - `features/admin/configs/components/concept-mapping/ConceptTable.tsx`
    - `features/topic-section-mapping/components/TopicMappingTable.tsx`

### Backend Blockers
- None.

### Recommended Implementation Order
1. Refactor all local `EmptyState` components to use the global `components/ui/empty-state.tsx`.
2. Refactor all local skeletons to use `components/ui/skeleton.tsx`.
3. Standardize all modals to extend `components/ui/modal.tsx`.
4. Ensure all tables utilize the base `components/ui/table.tsx` for consistent styling and accessibility.
