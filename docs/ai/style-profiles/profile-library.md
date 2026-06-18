# Style Profile Library

**Module:** Module 1.4.1 Style Profile System  
**Purpose:** Pre-defined profiles seeded in the system library.  
**Version:** 1.0.0

---

## Pre-seeded Profiles

### 1. Campus Placement
- **Target:** Entry-level developers and fresh college graduates.
- **Expected Level:** Knowledge of basic concepts, syntax, and data structures.
- **Characteristics:**
  - `questionLength`: `"short"`
  - `complexity`: `"low"`
  - `scenarioUsage`: `0.1` (low real-world scenarios)
  - `codeIntensity`: `0.4` (moderate syntax checks)
  - `theoryWeight`: `60`
  - `practicalWeight`: `40`
  - `difficultyBias`: `easy: 60%, medium: 30%, hard: 10%`

### 2. Experienced Hiring
- **Target:** Senior developers and lateral hires.
- **Expected Level:** Advanced system design, algorithms, optimization, and real-world debugging.
- **Characteristics:**
  - `questionLength`: `"long"`
  - `complexity`: `"high"`
  - `scenarioUsage`: `0.7` (heavy application scenarios)
  - `codeIntensity`: `0.8` (heavy debugging blocks)
  - `theoryWeight`: `20`
  - `practicalWeight`: `80`
  - `difficultyBias`: `easy: 20%, medium: 50%, hard: 30%`

### 3. Leadership Hiring
- **Target:** Technical managers, directors, or principal architects.
- **Expected Level:** Technical trade-offs, architecture decisions, trade-off analysis.
- **Characteristics:**
  - `questionLength`: `"long"`
  - `complexity`: `"high"`
  - `scenarioUsage`: `0.8` (hypothetical case studies)
  - `codeIntensity`: `0.2` (low code writing, high architecture)
  - `theoryWeight`: `75`
  - `practicalWeight`: `25`
  - `difficultyBias`: `easy: 10%, medium: 40%, hard: 50%`

### 4. Certification Exam
- **Target:** Standardized certifications.
- **Expected Level:** Complete coverage of core and elective modules under balanced constraints.
- **Characteristics:**
  - `questionLength`: `"medium"`
  - `complexity`: `"medium"`
  - `scenarioUsage`: `0.2`
  - `codeIntensity`: `0.5`
  - `theoryWeight`: `80`
  - `practicalWeight`: `20`
  - `difficultyBias`: `easy: 30%, medium: 50%, hard: 20%`
