# Backend Requirements for Concept → Template Mapping

## Findings from Phase 0 Verification

### Current Schema Limitations
- The `Template` model has a `conceptKey` (String), which enforces a One-to-Many relationship (One Concept can have Many Templates, but one Template belongs to only One Concept).
- There is a `Concept` model, but no mapping table linking `Concept` and `Template` for Many-to-Many relationships.
- There are no existing models like `ConceptTemplate`, `TemplateAssignment`, or `MappedTemplate`.

### Required Backend Changes
To fully support the Generation Ready Configuration Builder's requirement to map multiple concepts to multiple templates flexibly without duplicating templates, the following backend changes are required:

1. **Database Schema Update**
   Create a join table (e.g., `TemplateAssignment`) to support Many-to-Many mappings between Concepts and Templates.
   ```prisma
   model TemplateAssignment {
     id         String   @id @default(cuid())
     conceptId  String
     templateId String
     createdAt  DateTime @default(now())

     concept    Concept  @relation(fields: [conceptId], references: [id], onDelete: Cascade)
     template   Template @relation(fields: [templateId], references: [id], onDelete: Cascade)

     @@unique([conceptId, templateId])
     @@index([conceptId])
     @@index([templateId])
   }
   ```

2. **API Endpoint Updates**
   - **GET** `/api/v1/admin/concepts/:conceptId/templates` - Fetch templates assigned to a specific concept.
   - **POST** `/api/v1/admin/concepts/:conceptId/templates` - Assign templates to a concept.
   - **DELETE** `/api/v1/admin/concepts/:conceptId/templates/:templateId` - Remove a template assignment.

*Note: Since the backend does not currently support these models, the frontend implementation of Concept -> Template mapping will mock the assignment API calls or use existing fallback endpoints (like updating `Template.conceptKey`) until the backend is updated as documented above.*
