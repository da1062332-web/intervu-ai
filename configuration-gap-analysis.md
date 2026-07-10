# Configuration Builder Gap Analysis

## 1. Current Flow

The Configuration Builder is currently implemented as a set of tabs in the `admin/configs` feature, leveraging `useConfigWizardStore` and various components. The current flow involves:

- General Settings
- Sections Configuration (using `SectionBuilder`)
- Topic-Section Mapping (`TopicMappingTable`, `AvailableTopicsPanel`)
- Concept Mapping (`ConceptManagementPanel`, `ConceptTable`)
- Topics and Templates Summary tabs (read-only summaries)
- Difficulty Distribution
- Rule Flags
- Readiness / Validation (`ReadinessTab`, `ValidationWidget`)

## 2. Missing Integrations

- **Dynamic Topic Integration**: `ConceptManagementPanel.tsx` currently uses a hardcoded `TOPICS` array instead of dynamically loading topics from `GET /api/v1/admin/topics`. `AvailableTopicsPanel.tsx` uses `useAdminTopics` correctly but we must ensure it fully meets the requirements (search, selection, mapping).
- **Dynamic Concept Integration**: The concepts fetching currently relies on the hardcoded `TOPICS` array ID. Needs to dynamically respond to selected mapped topics.
- **Concept → Template Mapping**: This is entirely missing in the UI. `ConceptTable.tsx` does not show mapped templates or allow template assignment from `GET /api/v1/admin/templates`.
- **Weightage Validation**: `WeightageEditor.tsx` currently allows setting weightages, but we need strict validation (Total = exactly 100, no duplicates, disable save if invalid, 0-100 integer bounds).
- **Generation Readiness Panel**: `ReadinessTab.tsx` currently exists but uses mocked/inferred checks. A dedicated `GenerationReadinessPanel` (with Topics Assigned, Concepts Assigned, Templates Assigned, Weightages Complete, Validation Passed, overall status Green/Yellow/Red) is requested.

## 3. Blocking Issues

- Hardcoded `TOPICS` in `ConceptManagementPanel` prevents real topics from being used for concepts.
- Lack of Concept → Template mapping UI breaks the chain from Topic → Concept → Template.
- `WeightageEditor.tsx` has basic state management but lacks complete strict validation (e.g. disabling save, 100% enforcement).
- Readiness checks are rudimentary and not fully connected to the required validation engine.

## 4. Implementation Plan

1. **Dynamic Topics & Concepts**: Replace hardcoded `TOPICS` in `ConceptManagementPanel` with actual fetched topics mapped to the current configuration/section. Update search and filtering.
2. **Concept → Template Mapping**: Create a new UI component (`ConceptTemplateMapping` or modify `ConceptManagementPanel`) that fetches templates, displays Template Name/Status/Count, and allows assigning templates to specific concepts.
3. **Weightage Validation**: Enhance `WeightageEditor` to strictly enforce total = 100%, integer 0-100, update UI to reflect validation, disable invalid saves.
4. **Validation Engine & Readiness Panel**: Create/Update `GenerationReadinessPanel` to calculate all criteria (Topics, Concepts, Templates, Weightages) and display Green/Yellow/Red status. Run validation before save/generation.
5. **State Management & UX**: Ensure state sync across tabs. Add loading skeletons, empty states, and toast notifications.
6. **Tests**: Add Unit Tests (`TopicMapping.spec.tsx`, etc.) and E2E specs.
