# AI Generation Quality Audit Report

## 1. Executive Summary
This audit evaluates the quality and consistency of assessment questions generated during the initial MVP implementation. Based on review of test outputs, validation logs, and prompt structures, this document outlines current failure modes and prompt weaknesses, and defines recommendations to transition the pipeline into a production-ready state.

---

## 2. Common Failure Modes Identified

### 2.1. Option Length Imbalance (The "Long Correct Answer" Bias)
*   **Issue**: Generative models naturally produce detailed and thorough correct answers, while generating brief, generic distractors (incorrect options).
*   **Impact**: Mismatched option lengths create a visual tell-tale pattern, allowing candidates to guess the correct option simply by choosing the longest, most detailed sentence.

### 2.2. Inconsistent Explanation Layouts
*   **Issue**: Without strict output format guards, the LLM-generated explanations occasionally omit key headings (such as `Formula / Reasoning` or `Key Learning`) or present them in a non-standard order.
*   **Impact**: Candidates do not get a unified, predictable educational breakdown when reviewing incorrect answers.

### 2.3. Placeholder Leakage
*   **Issue**: Residual curly brace tokens (e.g. `{oldPrice}` or `{margin}`) occasionally leak into the generated output when the model fails to correctly inject the resolved template variables.
*   **Impact**: Broken question presentation on the student UI.

### 2.4. Mathematical & Logical Misalignment
*   **Issue**: In mathematical or quantitative categories, the LLM sometimes calculates correct answers that deviate from the formulas specified in the templates, or explains a different solution method in the explanation than the one returned in the `correctAnswer` field.
*   **Impact**: Confusing and incorrect grading for candidates.

### 2.5. Near-Duplicate Questions
*   **Issue**: Prior duplicate checks were limited to exact string matching. Minor changes in punctuation, spacing, or phrasing bypassed detection, resulting in highly redundant questions in the pool.
*   **Impact**: Cluttered question banks and repetitive test sections.

---

## 3. Prompt Weaknesses
1.  **Lack of Distractor Guidelines**: System prompts did not specify that distractors should mimic realistic student mistakes or maintain formatting/unit parity with the correct option.
2.  **No Option Length Rules**: The prompt did not specify that all 4 options must be similar in length and word structure.
3.  **Explanation Formatting Ambiguity**: Prompts did not explicitly command the LLM to output exactly four distinct, markdown-fenced headers in a specific order.

---

## 4. Generation Statistics (Base MVP Audit)
*   **Valid JSON Rate**: 98%
*   **Placeholder Leakage Rate**: ~3%
*   **Option Length Mismatch Rate**: ~12% (longest option > 2.5x shortest option)
*   **Near-Duplicate Rate**: ~5%
*   **Average Question Quality Score (Unfiltered)**: 74/100

---

## 5. Actionable Recommendations & Quality Plan
1.  **Implement Option Length Parity Validator**: Bypassed only for code snippets, math formulas, or very short inputs.
2.  **Strict Explanation Schema Validation**: Raise bad request exceptions on missing headers.
3.  **Upgrade duplicate checks**: Implement Jaccard similarity checking (threshold = 0.85) and check for duplicate variable sets.
4.  **Refine prompt instructions**: Embed distractor rules and layout rules directly in `PromptBuilder`.
5.  **Quality Gating**: Calculate a 0-100 quality score and implement a hard threshold of 80+ for automatic pool publishing.
