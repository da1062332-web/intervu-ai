# InterVu AI Frontend Architecture

## Dashboard State Management

We use a combination of Server State (React Query) and Client State (Zustand) to manage the dashboard.

### Zustand (`dashboard.store.ts`)

Handles persistent UI state:

- `activeTab`: Persists the currently viewed tab across page reloads.
- `timeRange`: Stores the selected time filter (e.g. '7d', '30d').
- `statusFilter`: Stores assessment status filters.

The store is wrapped with Zustand's `persist` middleware, saving data to `localStorage`.

## React Query & Synchronization

### Query Key Factory

We use Query Key factories to ensure type-safety and consistency:

- `userQueryKeys`: Manages `current()` and `sessions()`.
- `dashboardQueryKeys`: Manages `stats()`, `summary()`, and `activity()`.

### Global Configuration

The `QueryClient` defaults enforce strict background synchronization:

- `refetchOnWindowFocus`: true
- `refetchOnReconnect`: true
- `staleTime`: 60,000ms
- `gcTime`: 5 \* 60,000ms
- `networkMode`: 'offlineFirst'

### Cache Invalidation Rules

When mutating state, we invalidate specific query keys:

1. **Profile Updates**: `useUpdateProfile` invalidates `userQueryKeys.current()`.
2. **Session Deletion**: `useDeleteSession` and `useDeleteAllSessions` invalidate `userQueryKeys.sessions()`.
   _Note_: `useDeleteSession` implements optimistic updates to immediately remove the session from the UI before the network request completes, rolling back if it fails.

## Recovery Systems

### Offline Mode

By setting `networkMode: 'offlineFirst'`, React Query pauses mutations and queries when the user goes offline and automatically resumes them when the network reconnects.

### Error Handling & API Failures

All queries and mutations funnel through a centralized error handler in `query-provider.tsx`:

1. `shouldRetry`: Retries queries up to 2 times for transient errors (e.g., 500, network timeouts). It immediately bails on `400`, `401`, `403`, `404`, `422`.
2. `QueryCache.onError`: Automatically maps backend error structures into user-friendly toast notifications.
3. **Session Hydration**: If `session-hydrator.tsx` detects a `401`/`403` when verifying the user, it immediately clears `queryClient` and `authStore`, forcing a logout.

## Performance Optimization

- **Memoization**: Heavy derived data operations (like mapping dashboard stats into arrays for charting) are wrapped in `useMemo`.
- **Deferred Rendering**: Loading states utilize skeletal loading cards to prevent layout shifts.
