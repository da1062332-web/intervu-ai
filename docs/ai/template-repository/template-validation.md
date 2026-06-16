# Template Validation Rules

**Module:** 1.3.1 Template Repository  
**Objective:** Define the rules and constraints required to validate a Question Template.  
**Version:** 1.0.0

---

## 1. Overview

Before any template is loaded into the active selection registry or stored in the database, it must pass through the validation engine. Rejecting malformed templates upstream prevents LLM generation failures, parsing crashes, or invalid question formats downstream.

---

## 2. Validation Constraints

Every template must comply with the following structural and logical rules:

| Field | Validation Type | Constraint Description | Error Action / Message |
| :--- | :--- | :--- | :--- |
| `id` | **Required & Format** | Must be a valid, non-empty UUID. | Reject template. |
| `code` | **Required & Unique** | Must be a non-empty string. Must be globally unique in the repository database. | `"Template code must be unique."` |
| `name` | **Required** | Must be a non-empty string. | Reject template. |
| `templateType` | **Required & Match** | Must match one of the 8 specified types in `template-types.md`. | `"Invalid template type."` |
| `topicId` | **Required & Registry** | Must match an existing `id` in the `TopicRegistry`. | `"Topic ID must exist in Registry."` |
| `conceptId` | **Required & Registry** | Must match a concept associated with the `topicId` in the `TopicRegistry`. | `"Concept ID must be associated with the topic."` |
| `difficulty` | **Required & Support** | Must be `'easy'`, `'medium'`, or `'hard'`. The concept in the Topic Registry must support this difficulty level. | `"Difficulty level not supported by concept."` |
| `templateText` | **Required & Match** | Must contain text. All placeholder variables wrapped in curly braces (e.g., `{MY_VAR}`) must match exactly one variable in `variableSchema`. | `"Template placeholder variables must match schema."` |
| `variableSchema` | **Required & Unique** | Must be an array. Every variable entry must have a unique `variableName`. | `"Variable names must be unique within a template."` |

---

## 3. Zod Implementation Blueprint

The validation logic should map to the following schema definition:

```typescript
import { z } from "zod";

export const VariableSchemaValidator = z.object({
  variableName: z
    .string()
    .min(1, "Variable name cannot be empty.")
    .regex(/^[A-Z0-9_]+$/, "Variable name must be uppercase alphanumeric and underscores only."),
  variableType: z.enum(['number', 'string', 'boolean', 'code', 'array']),
  required: z.boolean(),
  constraints: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    choices: z.array(z.any()).optional(),
    regex: z.string().optional(),
    arrayElementType: z.enum(['number', 'string', 'boolean']).optional()
  }).optional()
});

export const QuestionTemplateSchema = z.object({
  id: z.string().uuid("Template ID must be a valid UUID."),
  code: z.string().min(3, "Template code must be at least 3 characters."),
  name: z.string().min(3, "Template name must be at least 3 characters."),
  templateType: z.enum([
    'mcq',
    'multiple-select',
    'true-false',
    'fill-blank',
    'code-output',
    'debugging',
    'scenario-based',
    'case-study'
  ]),
  topicId: z.string().min(1, "Topic ID is required."),
  conceptId: z.string().min(1, "Concept ID is required."),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  templateText: z.string().min(10, "Template text must be at least 10 characters long."),
  variableSchema: z.array(VariableSchemaValidator),
  active: z.boolean()
}).superRefine((data, ctx) => {
  // 1. Check if all placeholder variables in templateText exist in variableSchema
  const placeholders = data.templateText.match(/\{([A-Za-z0-9_]+)\}/g) || [];
  const placeholderNames = placeholders.map(p => p.slice(1, -1));

  const schemaNames = new Set(data.variableSchema.map(v => v.variableName));

  for (const name of placeholderNames) {
    if (!schemaNames.has(name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Placeholder {${name}} in templateText is missing from variableSchema.`,
        path: ["templateText"]
      });
    }
  }

  // 2. Check for duplicate variable definitions
  const seenVariables = new Set<string>();
  data.variableSchema.forEach((schema, idx) => {
    if (seenVariables.has(schema.variableName)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate variable name: ${schema.variableName}`,
        path: ["variableSchema", idx, "variableName"]
      });
    }
    seenVariables.add(schema.variableName);
  });
});
```
