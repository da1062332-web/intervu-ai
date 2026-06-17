# Variable Schema Standard

**Module:** 1.3.1 Template Repository  
**Objective:** Define the structure of parameters used for hydration.  
**Version:** 1.0.0

---

## 1. TypeScript Interface Specification

All template variable declarations must comply with the following contract:

```typescript
export interface VariableSchema {
  /**
   * The name of the variable placeholder used in template text.
   * Example: "ARRAY_SIZE", "INITIAL_VALUE"
   */
  variableName: string;

  /**
   * Allowed data types for the variable.
   */
  variableType: "string" | "number" | "boolean" | "array" | "code";

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
   * Allowed string or numeric options for selection.
   * Example: ["TypeScript", "Python", "Go"]
   */
  choices?: any[];

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

## 2. Parameter Types and Constraints

1.  **`number`**: Constraints must specify an optional range (`min` and `max`) or a distinct list of `choices`.
2.  **`string`**: Constraints can check length (`min`/`max`) or validate format using a `regex` pattern.
3.  **`boolean`**: Simple true/false evaluation (no additional constraints usually needed).
4.  **`array`**: Evaluates list structures. Must define `arrayElementType` and optional `min`/`max` lengths.
5.  **`code`**: A multiline string block representing code. Must specify a `regex` validation pattern to ensure formatting.
