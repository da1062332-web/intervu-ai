# Generation Strategy Implementation Blueprint

## 1. Decision Summary

The following decisions are now confirmed for the first implementation:

1. Primary scope for version 1
   - Support arithmetic and formula-based question templates as the core capability.
   - Keep the architecture extensible so logic-based questions can be added later without a full rewrite.

2. UI direction
   - Introduce a more dedicated Generation Strategy editor inside the existing template creation flow.
   - Keep the experience aligned with the current admin UI patterns: section-based navigation, cards, tables, modals, and consistent styling.
   - The variable and constraint experience must feel like part of the same unified template-authoring flow.

3. Deterministic-first approach
   - Version 1 must be fully deterministic and manual.
   - No AI dependency should be required for generation, validation, or answer computation.
   - AI-assisted drafting should be added later as an optional layer on top of the structured engine.

4. Clarification on logic-based support
   - The earlier question was asking whether the same system can support both arithmetic/formula-based questions and logic-based questions.
   - The answer is: yes in principle, but not in the same depth in version 1.
   - For version 1, we should support arithmetic/formula-based questions as the primary target and design the model so that a limited deterministic logic layer can be added later.
   - Fully general logic reasoning should be deferred to a later phase.

---

## 2. Product Goal

Build a structured, deterministic generation strategy system for template authoring that improves the current variable and constraint experience while remaining compatible with the existing project architecture.

The outcome should be:
- easier authoring for complex formula-based questions
- stronger validation before generation
- better support for derived variables and constraints
- a cleaner separation between generation logic and language rendering
- a path for AI-assisted drafting in a later phase

---

## 3. Scope for Version 1

### In scope
- Structured variable definition
- Derived variable support through formulas
- Constraint definition using deterministic rules
- Validation of generated values before use
- Preview support for template authoring
- Backward compatibility with existing templates
- A dedicated UI editor that fits the current admin template experience

### Out of scope for version 1
- Full AI-driven generation
- General-purpose symbolic logic engine
- Fully automatic natural-language question drafting
- Broad support for all possible logic-based question families

---

## 4. Architecture Principles

The implementation should follow these principles:

1. Deterministic first
   - The engine must calculate, validate, and decide without AI.
   - AI is only an optional formatting or drafting layer later.

2. Structured contract over ad-hoc logic
   - Template behavior should be expressed through a clear generation strategy object.
   - This makes the system easier to validate and extend.

3. Backward compatibility
   - Existing templates must continue to work.
   - Old variable and constraint formats should be mapped into the new structure.

4. Uniform authoring experience
   - Variable and constraint authoring must feel part of one coherent flow.
   - The UI should remain consistent with the rest of the project.

5. Incremental rollout
   - Implement the core engine and editor first.
   - Expand into more advanced logic support later.

---

## 5. Proposed Technical Architecture

### 5.1 Data model

The template should support a richer generation strategy structure, for example:

```json
{
  "generationStrategy": {
    "type": "VARIABLE",
    "variables": [],
    "derivedVariables": [],
    "constraints": [],
    "validationRules": [],
    "qualityRules": [],
    "optionStrategy": {},
    "solutionStrategy": {},
    "explanationStrategy": {}
  }
}
```

This should be stored in the existing JSON-based template fields so that no disruptive schema change is required in version 1.

### 5.2 Runtime flow

The runtime should follow this deterministic flow:

1. Load template strategy
2. Resolve independent variables
3. Evaluate derived variables
4. Apply constraints
5. Validate the generated dataset
6. Generate the answer and options
7. Hydrate the solution and explanation templates
8. Return structured output for rendering

### 5.3 Separation of responsibilities

- Deterministic engine
  - handles variable generation, formulas, constraints, validation, and answer computation

- LLM layer (future)
  - handles wording, rephrasing, explanation polish, and optional drafting

This preserves the correct boundary: the engine computes, the AI expresses.

---

## 6. Implementation Phases

### Phase 1 — Compatibility and contract foundation
Objectives:
- Introduce the richer generation strategy payload structure
- Keep old template formats working
- Ensure new data can be saved and retrieved safely

Deliverables:
- DTO and validation updates
- template service updates to support both legacy and new payload shapes
- backward-compatible parsing and normalization

### Phase 2 — Deterministic generation engine upgrade
Objectives:
- Support derived variables and formula-based dependencies
- Evaluate constraints in a structured way
- Add validation rules before accepting generated values

Deliverables:
- updates in the parameter generation service
- updates in the variable generation strategy
- improved reliability for arithmetic/formula-based templates

### Phase 3 — Dedicated UI editor
Objectives:
- Replace the current simplistic variable and constraint editing experience with a more structured generation strategy experience
- Keep the experience consistent with the current admin UI design system

Deliverables:
- enriched variable builder section
- enriched constraint builder section
- unified editor flow for the variable strategy module
- consistent styling and interaction patterns

### Phase 4 — Preview and validation experience
Objectives:
- Make it easy for authors to preview generated values and spot invalid configurations
- Improve template author confidence before publishing

Deliverables:
- preview improvements
- validation warnings and errors
- clearer author guidance in the UI

### Phase 5 — Optional AI-assisted drafting layer
Objectives:
- Add AI assistance later, after the deterministic core is stable

Deliverables:
- optional drafting support
- explanation enhancement
- wording refinement without replacing the engine

---

## 7. Frontend Implementation Plan

### UI structure
The template editor should remain in the existing admin template flow, but the variable-related sections should be expanded into a more dedicated “Generation Strategy” experience.

Recommended structure:
- Basic Information
- Question Definition
- Generation Strategy
- Option Strategy
- Solution & Explanation
- Preview

### UI behavior
The Generation Strategy section should include:
- Variables
- Derived Variables
- Constraints
- Validation Rules
- Quality Rules

The styling should follow the current project UI conventions:
- card-based layout
- table-based variable listing
- modal-based create/edit flows
- consistent spacing, typography, and action patterns

### Design requirement
The new editor must look and behave like a natural extension of the existing template-building experience, not like a completely separate feature.

---

## 8. Backend Implementation Plan

### Core files to update
- template DTOs
- template service
- parameter generation service
- variable generation strategy
- preview and validation flow

### Backend responsibilities
- normalize incoming template strategy payloads
- validate structure and dependencies
- generate values deterministically
- enforce constraints and validation rules
- produce structured data for solution and option generation

---

## 9. Backward Compatibility Strategy

Version 1 should support both:
- legacy template payloads
- new generation strategy payloads

The backend should apply a normalization layer so that old templates still behave as before while new templates can use the richer structure.

This is important because it reduces migration risk and avoids breaking existing assessments.

---

## 10. Risk Management

### Risk 1 — Over-scoping the first version
Mitigation:
- keep version 1 focused on arithmetic/formula-based templates and deterministic authoring

### Risk 2 — UI drift from existing patterns
Mitigation:
- reuse the existing section layout, styling, and interaction patterns

### Risk 3 — Breaking old templates
Mitigation:
- implement backward compatibility from day one

### Risk 4 — Making AI part of the core engine too early
Mitigation:
- keep AI as an optional later layer and preserve deterministic execution as the default path

---

## 11. Acceptance Criteria

The implementation is considered successful when:
- authors can define variables and constraints in a more structured way
- arithmetic/formula-based templates generate deterministically
- constraints and validation rules are enforced before generation
- the UI feels consistent with the existing template editor flow
- existing templates still continue to work
- the system is prepared for future AI-assisted drafting without rework

---

## 12. Recommended Delivery Order

1. Define the generation strategy payload contract
2. Add backend compatibility and normalization
3. Upgrade deterministic generation logic
4. Build the dedicated editor UI
5. Add preview and validation improvements
6. Keep AI-assisted drafting as a future enhancement

---

## 13. Final Recommendation

Proceed with a version 1 that is:
- deterministic
- manual
- formula-oriented
- backward compatible
- UI-consistent
- architecturally extensible for future logic support and AI assistance

This is the best balance between delivery speed, reliability, and long-term scalability.
