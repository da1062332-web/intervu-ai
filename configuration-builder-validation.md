# Configuration Builder Validation Architecture

The Configuration Builder utilizes a two-layer validation architecture designed to ensure that deterministic Question Generation is entirely immune to invalid, incomplete, or logically unsound configuration states.

## Layer 1: Client-Side Immediate Feedback

This layer lives directly within the UI components and custom React Hooks. It provides instantaneous feedback to the user as they build their Configuration.

### Key Components

1. **WeightageEditor bounds clamping**:
   - Enforces integer bounds between `0` and `100` natively in the input.
   - Highlights rows strictly with `border-red-500` if inputs are invalid.
   - Prevents local saves and highlights the active discrepancy against the mandated 100% total.
2. **Dynamic UI Guards**:
   - Forms (like Topic mapping or Concept templates) disable their submit buttons if selections are empty.

## Layer 2: Authoritative Engine (The Readiness Service)

This layer acts as the absolute source of truth for "Generation Readiness". It consumes the entire state tree of the Configuration and calculates a deterministic score.

### Key Components

1. **`validationEngine.ts`**:
   - A pure utility isolated from React.
   - Takes in `ValidationState` consisting of `Topics`, `Concepts`, `Templates`, and `Weightages`.
   - **Rules Evaluated**:
     - At least 1 topic must exist (`+20 points`).
     - Every mapped topic must have at least one active concept (`+30 points`).
     - At least one template must be assigned to concepts (Warning if missing, `+30 points`).
     - Weightages must perfectly sum up to `100%` (`+20 points`).
   - Outputs: `valid` (boolean), `readiness` (0-100 score), `errors` (array of hard blockers), `warnings` (array of soft pitfalls).

2. **`ConfigurationReadinessService.ts`**:
   - The data orchestration layer.
   - It seamlessly bridges multiple disconnected API calls (`topicsApi`, `conceptsApi`, `weightagesApi`) and aggregates them into the `ValidationState` required by the pure engine.

3. **Generation Ready Gate**:
   - The `Generate Test Assembly` button in the final step is absolutely gated by `useConfigurationValidation().valid`.
   - By gating the entire workflow natively through this engine, we guarantee that backend assessment generation never receives partially mapped configurations.
