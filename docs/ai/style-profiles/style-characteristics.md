# Style Characteristic Registry

**Module:** Module 1.4.1 Style Profile System  
**Purpose:** Defines characteristics that guide question generation style and layout.  
**Version:** 1.0.0

---

## Supported Characteristics

### 1. Question Length
- **Key:** `questionLength`
- **Allowed Values:** `"short"` | `"medium"` | `"long"`
- **Description:** Adjusts the verbose description length of the question text. Useful for adjusting cognitive reading load.

### 2. Complexity
- **Key:** `complexity`
- **Allowed Values:** `"low"` | `"medium"` | `"high"`
- **Description:** Defines the mathematical or logical complexity of the problem structure (e.g. number of variables or constraints).

### 3. Scenario Usage
- **Key:** `scenarioUsage`
- **Allowed Values:** Float between `0.0` and `1.0` (percentage representation)
- **Description:** Determines the probability of generating scenario-based real-world application questions versus pure academic questions.

### 4. Code Intensity
- **Key:** `codeIntensity`
- **Allowed Values:** Float between `0.0` and `1.0`
- **Description:** Dictates the presence of code blocks or pseudocode snippets in the question or options.

### 5. Theory Weight
- **Key:** `theoryWeight`
- **Allowed Values:** Integer between `0` and `100`
- **Description:** Weight percentage for abstract or conceptual questions in the exam.

### 6. Practical Weight
- **Key:** `practicalWeight`
- **Allowed Values:** Integer between `0` and `100`
- **Description:** Weight percentage for algorithmic, hands-on, or mathematical application questions in the exam.
- **Rule:** `theoryWeight + practicalWeight` must equal `100`.

### 7. Difficulty Bias
- **Key:** `difficultyBias`
- **Allowed Values:** Object with schema `{ easy: number, medium: number, hard: number }` where total sums to 100.
- **Description:** Directs the distribution of questions to specific cognitive difficulty tiers.
