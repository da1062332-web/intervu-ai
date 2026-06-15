# API ↔ Database Mapping Matrix

This document maps each MVP backend endpoint to its underlying database tables to ensure that every endpoint has corresponding persistence support. No endpoint may be implemented without verification of this persistence layer mapping.

| API Endpoint                          | HTTP Method | Target Tables (Prisma)                                  | Purpose                                                                 |
| :------------------------------------ | :---------- | :------------------------------------------------------ | :---------------------------------------------------------------------- |
| `/api/v1/auth/signup`                 | POST        | `User`, `Session`, `RefreshToken`                       | Registers candidate account, initiates session.                         |
| `/api/v1/auth/login`                  | POST        | `User`, `Session`, `RefreshToken`                       | Validates credentials, initiates session.                               |
| `/api/v1/auth/refresh`                | POST        | `Session`, `RefreshToken`, `User`                       | Revokes and rotates access/refresh tokens.                              |
| `/api/v1/auth/logout`                 | POST        | `RefreshToken`                                          | Revokes active refresh token.                                           |
| `/api/v1/auth/me`                     | GET         | `User`                                                  | Fetches active user profile info.                                       |
| `/api/v1/dashboard`                   | GET         | `TestConfig`, `TestSection`, `Test`, `EvaluationResult` | Fetches consolidated stats, active assessments, and completed attempts. |
| `/api/v1/dashboard/stats`             | GET         | `Test`, `EvaluationResult`                              | Retrieves total attempts, pass rates, average scores.                   |
| `/api/v1/dashboard/analytics-summary` | GET         | `EvaluationResult`, `SkillScore`                        | Retrieves aggregated scores per skill category.                         |
| `/api/v1/dashboard/recent-activity`   | GET         | `Test`, `EvaluationResult`                              | Retrieves list of chronological candidate events.                       |
| `/api/v1/tests/configs`               | GET         | `TestConfig`, `TestSection`, `TestRule`                 | Returns active test configuration blueprints.                           |
| `/api/v1/admin/configs`               | POST        | `ExamConfig`                                            | Creates a new Exam Configuration.                                       |
| `/api/v1/admin/configs`               | GET         | `ExamConfig`                                            | Lists active Exam Configurations.                                       |
| `/api/v1/admin/configs/:id`           | GET         | `ExamConfig`                                            | Retrieves a single Exam Configuration details.                          |

---

## Mapping Compliance Rules

1. **Transaction Integrity:** Mappings involving multiple tables (such as `/auth/signup` affecting `User`, `Session`, and `RefreshToken`) must be executed inside a database transaction (`prisma.$transaction`) to maintain data integrity.
2. **Cascading Deletes:** Deletes on parent tables must cascade to children as mapped in `schema.prisma` (e.g. deleting a `User` cascades to delete their `Session` and `RefreshToken` records).
3. **Repository Pattern:** Under no circumstances should raw database queries run inside NestJS controllers or services. All writes and reads must route through repositories representing these mapped tables.
