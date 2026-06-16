# Variable Schema Contract Specification

**Module:** 1.3.1 Template Repository  
**Objective:** Define the interface for the Variable Schema within templates.  
**Version:** 1.0.0

---

## 1. Interface Definition

All template variable declarations must comply with the following TypeScript contract:

```typescript
export interface VariableSchema {
  /**
   * The name of the variable placeholder used in template text.
   * Example: "ARRAY_SIZE", "CODE_SNIPPET"
   */
  variableName: string;

  /**
   * Allowed data types for the variable.
   */
  variableType: "number" | "string" | "boolean" | "code" | "array";

  /**
   * Indicates whether the variable must be populated during hydration.
   */
  required: boolean;

  /**
   * Validation and generation constraints.
   */
  constraints?: VariableConstraints;
}

export interface VariableConstraints {
  /**
   * Minimum value for numeric variables, or minimum length for string/array variables.
   */
  min?: number;

  /**
   * Maximum value for numeric variables, or maximum length for string/array variables.
   */
  max?: number;

  /**
   * Allowed string options for selection.
   * Example: ["TypeScript", "Python", "Go"]
   */
  choices?: string[];

  /**
   * Regex validator pattern for string/code variables.
   */
  regex?: string;

  /**
   * Type of elements contained in the array (if variableType is "array").
   */
  arrayElementType?: "number" | "string" | "boolean";
}
```

---

## 2. Examples of Variable Schemas

### 1. Numeric Range (`AGE`)

```json
{
  "variableName": "AGE",
  "variableType": "number",
  "required": true,
  "constraints": {
    "min": 18,
    "max": 65
  }
}
```

### 2. Choice Array (`ARRAY_SIZE`)

```json
{
  "variableName": "ARRAY_SIZE",
  "variableType": "number",
  "required": true,
  "constraints": {
    "choices": [5, 10, 15, 20]
  }
}
```

### 3. Code Block (`CODE_SNIPPET`)

```json
{
  "variableName": "CODE_SNIPPET",
  "variableType": "code",
  "required": true,
  "constraints": {
    "regex": "^[\\s\\S]{10,1000}$"
  }
}
```
