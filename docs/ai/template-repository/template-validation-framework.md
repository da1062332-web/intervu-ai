# Template Validation Framework

**Module:** 1.3.1 Template Repository  
**Objective:** Define validation rules and the programmatic schema for Question Templates.  
**Version:** 1.0.0

---

## 1. Validation Constraints

Before any template is saved to the database or registered as active, it must pass the validation engine checks. This prevents runtime errors during hydration or LLM calls.

| Field | Check Type | Description |
| :--- | :--- | :--- |
| **`id`** | Required & UUID/CUID | Must be a valid identifier. |
| **`code`** | Required & Unique | Must be globally unique in the database. |
| **`name`** | Required | Non-empty display name. |
| **`templateType`** | Required & Match | Must match one of the 8 types in the Template Type Registry. |
| **`topicId`** | Required & Match | Must reference a valid Topic ID in the Topic Registry. |
| **`conceptId`** | Required & Match | Must reference a Concept ID associated with the topic. |
| **`difficulty`** | Required & Support | Must be `'easy'`, `'medium'`, or `'hard'`. |
| **`templateText`** | Required & Cross-Match | Must contain the text pattern. Every bracketed placeholder (e.g. `{VAR}`) must have a corresponding variable in the `variables` array. |
| **`variables`** | Required & Unique Names | Every parameter defined in the array must have a unique `variableName` and a valid type. |

---

## 2. Zod Validation Blueprint

The validation engine uses the following schema blueprint to validate incoming templates:

```typescript
import { z } from "zod";

export const VariableSchemaValidator = z.object({
  variableName: z
    .string()
    .min(1, "Variable name cannot be empty.")
    .regex(
      /^[A-Z0-9_]+$/,
      "Variable name must be uppercase alphanumeric and underscores only."
    ),
  variableType: z.enum(["string", "number", "boolean", "array", "code"]),
  required: z.boolean(),
  constraints: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      choices: z.array(z.any()).optional(),
      regex: z.string().optional(),
      arrayElementType: z.enum(["number", "string", "boolean"]).optional(),
    })
    .optional(),
});

export const QuestionTemplateValidator = z
  .object({
    id: z.string().min(1, "Template ID is required."),
    code: z.string().min(3, "Template code must be at least 3 characters."),
    name: z.string().min(3, "Template name must be at least 3 characters."),
    topicId: z.string().min(1, "Topic ID is required."),
    conceptId: z.string().min(1, "Concept ID is required."),
    templateType: z.enum([
      "mcq",
      "multiple-select",
      "true-false",
      "fill-blank",
      "code-output",
      "debugging",
      "scenario-based",
      "case-study",
    ]),
    difficulty: z.enum(["easy", "medium", "hard"]),
    templateText: z
      .string()
      .min(10, "Template text must be at least 10 characters long."),
    variables: z.array(VariableSchemaValidator),
    active: z.boolean(),
    version: z.number().int().positive(),
  })
  .superRefine((data, ctx) => {
    // 1. Extract bracketed placeholders from templateText
    const placeholderMatches = data.templateText.match(/\{([A-Z0-9_]+)\}/g) || [];
    const placeholders = placeholderMatches.map((p) => p.slice(1, -1));

    // 2. Map schema variable names
    const schemaNames = new Set(data.variables.map((v) => v.variableName));

    // 3. Ensure every placeholder matches a schema variable
    for (const placeholder of placeholders) {
      if (!schemaNames.has(placeholder)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Placeholder {${placeholder}} in templateText is missing from the variables array.`,
          path: ["templateText"],
        });
      }
    }

    // 4. Ensure no duplicate variables are defined in the schema
    const seenVariables = new Set<string>();
    data.variables.forEach((variable, index) => {
      if (seenVariables.has(variable.variableName)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate variable name detected: ${variable.variableName}`,
          path: ["variables", index, "variableName"],
        });
      }
      seenVariables.add(variable.variableName);
    });
  });
```
