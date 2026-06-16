# RBAC Permission Matrix

This document defines the Role-Based Access Control (RBAC) permissions matrix for the InterVu AI API endpoints.

## Permission Matrix

| Resource                | API Path                 | ADMIN | CANDIDATE | Details / Ownership Enforcements                         |
| :---------------------- | :----------------------- | :---: | :-------: | :------------------------------------------------------- |
| **Auth**                | `/auth/*`                |   ✓   |     ✓     | Public signup/login, token refresh, and logout.          |
| **User Profile**        | `/users/me`              |   ✗   |     ✓     | Accesses candidate's own profile.                        |
| **User Profile Update** | `/users/profile`         |   ✗   |     ✓     | Updates candidate's own profile fields.                  |
| **User Sessions**       | `/users/sessions`        |   ✗   |     ✓     | Manages candidate's own active login sessions.           |
| **Exam Configs**        | `/admin/configs/*`       |   ✓   |     ✗     | Create, list, or view exam templates.                    |
| **System Settings**     | `/config/system`         |   ✓   |     ✗     | Centralized system difficulty and queue parameters.      |
| **Templates**           | `/templates/*`           |   ✓   |     ✗     | Manage question templates for generation.                |
| **Assembly Build**      | `/api/v1/assembly/build` |   ✓   |     ✗     | Build test instances from exam configs.                  |
| **Assembly Get**        | `/api/v1/assembly/:id`   |   ✓   |     ✓     | Retrieve details of an assembled test instance.          |
| **Queue Status**        | `/queue/*`               |   ✓   |     ✗     | Monitor BullMQ job queues.                               |
| **Tests Discovery**     | `/tests/configs`         |   ✗   |     ✓     | Discover available configurations to start.              |
| **Tests Start**         | `/tests/start`           |   ✗   |     ✓     | Start a test session and create instance.                |
| **Test Execution**      | `/tests/:id/*`           |   ✗   |     ✓     | Autosave answers, load snapshot, and submit tests.       |
| **Evaluation**          | `/evaluation/:answerId`  |   ✓   |     ✓     | Candidate can only view evaluation of their own answers. |
| **Results**             | `/v1/results/:id`        |   ✓   |     ✓     | Candidate can only view their own test attempt results.  |

## Notes on Implementation

1. **RolesGuard**: The global `RolesGuard` checks the route's roles metadata (`@Roles(...)`).
2. **Access Token Payload**: The JWT access token contains `sub` (User ID) and `role` (ADMIN/CANDIDATE).
3. **HTTP 403**: Any request from an unauthorized role triggers a `403 Forbidden` exception response.
