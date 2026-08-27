# Question Bank Quality Audit & Defect Discovery Report

## Executive Overview
A comprehensive automated quality audit was conducted across the **1,235 question dataset** in the IntervuAI primary question bank, candidate runtime snapshots, and test assembly packages. The audit evaluated question integrity, MCQ option and answer parity, explanation accuracy, and coding test suite completeness.

---

## 1. Quality Audit Classification Summary

| Classification | Question Count | Percentage | Definition |
| :--- | :---: | :---: | :--- |
| 🟢 **VALID** | **575** | **46.6%** | Questions that met all schema, structural, educational, and execution standards. |
| 🟡 **NEEDS_FIX** | **271** | **21.9%** | Questions with non-blocking defects such as formatting inconsistencies, floating-point mismatches, or option letter misalignments. |
| 🔴 **INVALID** | **389** | **31.5%** | Questions with critical defects such as missing correct answers, missing options lists, placeholder coding tests, or contradictory explanations. |
| **Total Questions Audited** | **1,235** | **100.0%** | Comprehensive audit across Mathematical, Logical, Verbal, Puzzle, and Coding sections. |

---

## 2. Identified Defect Categories & Findings

### 1. Missing Correct Answers in MCQ Data (376 Questions — `INVALID`)
* **Finding**: 376 questions contained answer strings in raw metadata (`metadata.answer`), but their structured `mcqData.correctAnswer` field was `null` or omitted.
* **Impact**: Candidate execution UI and objective evaluation engines failed to resolve the correct answer during test scoring.

### 2. Floating-Point & Currency Precision Mismatches (100 Questions — `NEEDS_FIX`)
* **Finding**: 100 questions exhibited string precision mismatches between options and stored answers (e.g. options storing `₹3238.40` while the answer stored `₹3238.4`, or trailing decimal zeroes omitted).
* **Impact**: String-comparison grading failed to match mathematically equivalent candidate selections.

### 3. Coding Test Suite Deficiencies & Placeholder Payloads (98 Questions — `INVALID / NEEDS_FIX`)
* **Finding**: Coding questions lacked structured multi-category test suites. Several questions used generic placeholder inputs (e.g. `{"query": "sample"}` or `{"n": 67}`) that did not match the problem statements.
* **Impact**: Candidate code submissions could not be validated against hidden, boundary, or stress test scenarios.

### 4. Option Letter Reference Mismatches in Explanations (97 Questions — `NEEDS_FIX`)
* **Finding**: 97 question explanations ended with static text references (e.g. *"The correct option is B"*), but option order shuffling placed the correct answer at a different index.
* **Impact**: Candidates reviewing solution rationales were presented with conflicting option letters.

### 5. Distractor & Formatting Inconsistencies (65 Questions — `NEEDS_FIX`)
* **Finding**: Inconsistent whitespace formatting, ambiguous duplicate distractors, and unstandardized mathematical symbol notation across questions.

### 6. Hallucinated or Contradictory Explanations (4 Questions — `INVALID`)
* **Finding**: Explanations in 4 questions contained direct contradictions to the question statement or referenced unrelated variables.

### 7. Empty or Generic Explanations (3 Questions — `NEEDS_FIX`)
* **Finding**: 3 questions contained valid options and answers but completely lacked step-by-step conceptual explanations.

### 8. Missing Options Lists in Snapshots (2 Questions — `INVALID`)
* **Finding**: Snapshot `options` arrays were empty in candidate test instances, causing Verbal Ability questions to render numeric input boxes instead of multiple-choice radio options.

---

## 3. Code Execution Engine & Sandbox Findings

1. **JVM Metaspace Initialization Crash**:
   * OpenJDK 13 in Judge0 sandbox attempted to reserve 1 GB (`1,073,741,824 bytes`) of virtual address space by default, exceeding isolate memory limits and aborting VM startup with `Could not allocate metaspace`.
2. **Standard Input Serialization Failure**:
   * Dictionary inputs in multi-argument functions were flattened into newline-separated text strings, breaking `json.loads` parsing in Python.
3. **Output Unwrapping Discrepancy**:
   * Single-key result wrappers (`{"indices": [1, 2]}`) caused output comparison mismatches when candidate functions returned raw return values (`[1, 2]`).
4. **Python 3.8 Type Hint Incompatibility**:
   * Modern subscripted type hints (`list[int]`) triggered `TypeError: 'type' object is not subscriptable` in Python 3.8 environments without `from __future__ import annotations`.

---

## 4. Defect Tracking Matrix

| Defect Category | Severity | Impacted Tables | Identified Volume |
| :--- | :---: | :---: | :---: |
| Missing `mcqData.correctAnswer` | Critical | `Question`, `TestInstanceQuestion`, `assembled_test_questions` | 376 |
| Floating-Point / Currency Discrepancies | Medium | `Question`, `GeneratedQuestion` | 100 |
| Coding Test Suite Gaps | High | `Question`, `TestInstanceQuestion`, `assembled_test_questions` | 98 |
| Option Letter Inconsistencies | Medium | `Question` | 97 |
| Formatting & Distractor Normalization | Low | `Question` | 65 |
| Hallucinated Explanations | High | `Question` | 4 |
| Missing Explanation Content | Medium | `Question` | 3 |
| Missing Snapshot Options | Critical | `TestInstanceQuestion` | 2 |
