# Frontend ↔ Backend Mapping Matrix

This document maps every Next.js 15 screen/page route to the respective NestJS backend API endpoints it consumes. This mapping prevents orphan frontend pages and ensure every screen consumes validated backend endpoints.

| Frontend Page / Screen Route | App Directory Path                      | Consumed API Endpoints             | Purpose / Description                                                    |
| :--------------------------- | :-------------------------------------- | :--------------------------------- | :----------------------------------------------------------------------- |
| **Login**                    | `apps/web/src/app/(auth)/login`         | `POST /api/v1/auth/login`          | Renders the login form, handles session initiation, stores tokens.       |
| **Signup**                   | `apps/web/src/app/(auth)/signup`        | `POST /api/v1/auth/signup`         | Renders signup fields, creates new candidate, initiates session.         |
| **Dashboard (Home)**         | `apps/web/src/app/(dashboard)/page.tsx` | `GET /api/v1/dashboard`            | Main candidate dashboard view showing assessments, active runs, history. |
| **Candidate Dashboard**      | `apps/web/src/app/candidate/dashboard`  | `GET /api/v1/dashboard`            | Candidate-specific test and workflow management viewport.                |
| **Assessments Library**      | `apps/web/src/app/(dashboard)/tests`    | `GET /api/v1/tests/configs`        | Renders a catalog of available configurations a user can launch.         |
| **Profile**                  | `apps/web/src/app/(dashboard)/profile`  | `GET /api/v1/auth/me`              | Displays candidate profile metrics, basic info, and security stats.      |
| **Results**                  | `apps/web/src/app/(dashboard)/results`  | `GET /api/v1/results/:id` (Future) | Displays evaluation reports and metrics for a completed test attempt.    |

---

## Mapping Compliance Rules

1. **API Layer Decoupling:** Components must **never** call `fetch` or Axios directly inside UI pages or components. All API requests must be declared inside services (e.g. `apps/web/src/services/`) and invoked via React hooks (e.g. `apps/web/src/hooks/`).
2. **Defensive Rendering:** All UI components consuming these endpoints must handle loading, error, and empty states gracefully.
3. **Token Management:** The frontend must intercept HTTP requests to inject the active access token and handle transparent token refresh (401 interception) using `POST /api/v1/auth/refresh`.
