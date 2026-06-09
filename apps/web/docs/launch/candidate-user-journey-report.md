# Candidate User Journey Report

This document audits the complete end-to-end UX flow for a Candidate in the InterVu AI platform.

## Journey Flow

### 1. Login
- Validated Zod-based strict email/password form validation.
- Successful authentication cleanly redirects to `/candidate/dashboard`.

### 2. Dashboard
- Fetches all assigned assessments.
- Active tests prominently display a `Start Assessment` CTA.
- "Marked for Review" tests or "Completed" tests render distinctly in the UI.

### 3. Test Details -> Instructions
- Clicking a Test brings up eligibility checks.
- If eligible, candidate is routed to `/candidate/tests/[id]/instructions`.
- Consent checkboxes must be explicitly ticked before the `Begin Test` button becomes active.

### 4. Execution
- Strict test environment.
- Left Panel: Active Question rendering.
- Right Panel: Color-coded Question Palette (Answered, Unanswered, Marked for Review).

### 5. Autosave & Resume (Recovery)
- Every interaction automatically queues a debounce save to `localStorage` and the `API`.
- Disconnections surface an offline banner, and reconnections show a `Restoring...` banner.
- Browsers closes/refreshes cleanly route back to the execution view and automatically reload the exact question index and timer state.

### 6. Submission
- Submission triggers the custom `<SubmissionModal />` summarizing unanswered and marked-for-review questions.
- Acknowledgment automatically routes the user to Results.

### 7. Results
- Fetches and dynamically derives performance insights (Score, Skills, Strengths/Weaknesses).
- Provides actionable recommendations with strict priority ordering.
- Includes a clean escape hatch "Return to Dashboard" to begin the cycle anew.

**UX Verdict**: Highly cohesive, deterministic, and strict. Ready for production.
