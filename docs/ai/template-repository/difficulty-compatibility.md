# Difficulty Compatibility Matrix

**Module:** 1.3.1 Template Repository  
**Objective:** Define compatibility rules between Template Types and cognitive Difficulty levels.  
**Version:** 1.0.0

---

## 1. Overview

The **Difficulty Compatibility Matrix** acts as a pre-filtering mechanism during exam generation. It maps question categories to the difficulty levels they can naturally represent. Certain template types (like `True/False`) cannot represent complex cognitive tests and are filtered out of Hard exams, while other types (like `Case Study` or `Debugging`) are too complex for Easy assessments.

---

## 2. Compatibility Matrix

| Template Type | Easy | Medium | Hard | Reason & Justification |
| :--- | :---: | :---: | :---: | :--- |
| **MCQ** | ✅ | ✅ | ✅ | Scalable from basic definitions (Easy) to complex architectural reasoning (Hard). |
| **Multiple Select** | ❌ | ✅ | ✅ | Multi-choice checking represents a higher cognitive load, not suitable for Easy/entry-level recall. |
| **True / False** | ✅ | ✅ | ❌ | Binary choices are too simple for Hard levels, which require deep evaluation, not binary fact-checking. |
| **Fill in Blank** | ✅ | ✅ | ❌ | Typographical or keyword identification tests do not scale to Hard problem-solving. |
| **Code Output** | ✅ | ✅ | ✅ | Scalable: predicting simple linear code (Easy), nested loop tracing (Medium), or recursion/concurrency (Hard). |
| **Debugging** | ❌ | ✅ | ✅ | Finding logic errors requires comprehension of full snippets, exceeding Easy levels. |
| **Scenario Based** | ❌ | ✅ | ✅ | Requires evaluating multi-faceted trade-offs, which is not suitable for Easy assessments. |
| **Case Study** | ❌ | ❌ | ✅ | Involves reading large system structures and analyzing systemic failures, strictly suited for Hard/Senior levels. |

---

## 3. Enforcement Logic

During template selection:
1.  The system reads the blueprint's target difficulty (e.g., `hard`).
2.  It references this matrix to identify compatible template types for the target difficulty level.
3.  Templates of incompatible types (e.g., `True/False` or `Fill in the Blank` for `hard` difficulty) are excluded from the selection candidate pool immediately.
