# Day 5: Results & Recommendations Experience

## Overview

This document outlines the frontend architecture and implementation for the Candidate Results and Recommendations dashboard. Once an assessment is completed, candidates land here to review their performance metrics and actionable insights.

## Component Hierarchy

The page is completely self-contained within `features/candidate/results` to follow the Modular Monolith strategy, preventing leakage into Admin panels.

```
app/candidate/results/[id]/page.tsx
 ├── ResultsHeader.tsx
 ├── OverallScoreCard.tsx
 ├── (Grid)
 │    ├── (Left Column)
 │    │    ├── SkillBreakdownCard.tsx
 │    │    └── RecommendationCard.tsx
 │    └── (Right Column)
 │         ├── StrengthCard.tsx
 │         └── WeaknessCard.tsx
 └── PerformanceSummaryCard.tsx
```

## State Flow & Data Derivation

The UI uses `zustand` (`useResultsStore.ts`) to manage data independently of the view layer.

- `evaluation`, `skills`, `recommendations`, and `performanceSummary` are stored securely.
- **Dynamic Derivation**: The `useResults.ts` hook automatically computes **Strengths** (top 3 skills scoring ≥ 70) and **Weaknesses** (lowest 3 skills scoring < 60) dynamically from the active `skills` array. There are absolutely no hardcoded strings for weaknesses/strengths.

## API Consumption Strategy

Currently simulated via `results.service.ts` using local `results.mock.ts` contracts.

- `getResults()`
- `getRecommendations()`
- `getPerformanceSummary()`

## Responsive Strategy

Built entirely with Tailwind CSS utility grids:

- **Mobile (`< md`)**: One single stacked column. All cards display sequentially to prevent horizontal scroll.
- **Tablet/Desktop (`>= lg`)**: Uses an asymmetrical CSS grid `grid-cols-12`. The deep-dive skills and recommendations span `col-span-8`, while the summary strengths/weaknesses span `col-span-4`.

## Error & Loading Handling

- **`ResultsSkeleton.tsx`**: Mimics the exact CSS grid of the final layout to prevent layout shift upon load.
- **`ResultsError.tsx`**: Triggers elegantly if network requests fail or the assessment is missing, offering a native "Retry" capability.
