# Contract Governance Rules

This document outlines the mandatory architectural and compliance rules for the InterVu AI project. These rules prevent contract drift and code fragmentation. Every team member must follow these rules without exception.

---

## The Mandatory Rules

### **Rule 1: User Stories define behavior**

No feature behavior may be invented by developers. All workflows, screens, and business logic paths must strictly align with the approved User Stories.

### **Rule 2: API Contract defines communication**

The API specification (e.g. `docs/contracts/`) is the absolute authority on system integration. Frontends and Backends must communicate exclusively through fields and routes defined in this spec.

### **Rule 3: Database Architecture defines persistence**

The database schema must accurately map to the designated persistence documents. All table modifications must go through formal migrations; manual modifications of local DBs are forbidden.

### **Rule 4: Frontend cannot invent fields**

When consuming backend payloads, the frontend must strictly map properties to DTO types. If the backend schema does not supply a field, the frontend must request a contract change instead of adding placeholder logic or dummy fields.

### **Rule 5: Backend cannot invent responses**

Every backend response must be wrapped in the standard envelope. Controllers must return exact contract types and ensure proper HTTP status codes.

### **Rule 6: Database cannot invent structures**

New tables or relationships must be mapped to the persistence blueprint. All tables must use CUID identifiers for consistency.

### **Rule 7: Shared contracts are mandatory**

No local definition of schemas or interfaces is allowed. Common interfaces, DTOs, and validation logic must reside in shared packages (e.g., `packages/contracts`) and be imported.

### **Rule 8: Breaking changes require approval**

Any change to endpoints, database tables, or contract schemas requires a formal request and sign-off by the Integration Owner (Developer 5) before development begins.
