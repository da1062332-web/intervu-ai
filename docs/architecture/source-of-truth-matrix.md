# MVP Source-of-Truth Matrix

This document defines the authoritative reference for each component of the InterVu AI platform. Developers must implement strictly according to the mapped source of truth. No assumptions or custom naming conventions are allowed.

| Area | Source of Truth | Reference Document | Key Contacts / Owners |
| :--- | :--- | :--- | :--- |
| **Auth** | MVP API Contract | [generation-contract-spec.md](file:///c:/code/intervu-ai/docs/contracts/generation-contract-spec.md) | Developer 1 (Contracts Owner) |
| **Dashboard** | User Stories | Sprint MVP User Stories (Candidate Dashboard) | Developer 3 (Frontend Owner) |
| **Test Config** | Database Schema | [schema.prisma](file:///c:/code/intervu-ai/packages/database/prisma/schema.prisma) & [day1-persistence-foundation.md](file:///c:/code/intervu-ai/docs/database/day1-persistence-foundation.md) | Developer 2 (Database Owner) |
| **Generation** | Module 2 Specification | [generation-contract-spec.md](file:///c:/code/intervu-ai/docs/contracts/generation-contract-spec.md) | AI + Full Stack Integrator |
| **Assembly** | Module 3 Specification | Assembly Specs & Blueprint Configs | AI + Full Stack Integrator |
| **Execution** | Module 4 Specification | Test Execution Lifecycle Rules | AI + Full Stack Integrator |
| **Evaluation** | Module 5 Specification | Evaluation Criteria & Assessment Models | AI + Full Stack Integrator |
| **Candidate Experience** | Module 6 Specification | Frontend Candidate UI & Testing Environment Rules | Developer 3 & 5 |

---

## Strict Alignment Rules

1. **Rule of Precedence:** If a conflict arises between the code implementation and the source of truth, the source of truth **always** wins. The code must be refactored to align with the documentation, not vice-versa.
2. **DTO & Schema Enforcement:** All field names must match the exact case and spelling defined in the source of truth. (e.g., if the schema defines `testConfigId`, the frontend cannot use `configId`).
3. **Change Approval:** Any change to a source-of-truth document must go through a formal review by the Architecture Owner (Developer 5) and be propagated to all mappings before coding begins.
