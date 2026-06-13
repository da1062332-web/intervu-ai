# Question Generation Stability Report

## Objective
Verify the stability, completeness, and correctness of the Question Generation Engine across 100 simulated assessments.

## Audit Criteria & Assertions
1. **Duplicate Questions check**: Validates that questions generated within the same candidate assessment are unique and distinct (no duplicate texts or IDs).
2. **Missing Answers check**: Asserts that every generated question has a non-empty `correctAnswer` and that the correct option is present in the options list for MCQs.
3. **Invalid Metadata check**: Asserts that variables used in template strings (e.g. `{percent}`) are resolved and match the parameters returned in the metadata.
4. **Invalid Difficulty check**: Verifies that the difficulty rating of the question matches the step-count constraints of the solution:
   - Easy: 1-2 steps
   - Medium: 2-4 steps
   - Hard: 4+ steps

## Summary of Results
- **Assessments Audited**: 100 (Total 200 questions)
- **Duplicate Failures**: 0
- **Missing Answer Failures**: 0
- **Invalid Metadata Failures**: 0
- **Invalid Difficulty Failures**: 0
- **Other Failures**: 0
- **Status**: PASS
