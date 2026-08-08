# AI Strategy Builder API - Swagger Documentation

## Overview

The AI Strategy Builder API provides three endpoints for AI-assisted and manual generation strategy drafting. All endpoints require JWT authentication and Admin role.

## Authentication

All endpoints require:

```
Authorization: Bearer {jwt_token}
X-Intervu-Admin: true (implied by RBAC)
```

---

## Endpoint 1: Draft Strategy from Prompt

### `POST /templates/{id}/ai/strategy/draft`

Generates an AI-drafted strategy (variables, derived variables, constraints) from a plain-English description.

#### Summary

Draft a strategy from plain-English description

#### Description

AI-assisted drafting of variable and constraint strategies. Returns a structured draft ready for preview and application.

#### Parameters

| Name | In   | Type   | Required | Description           |
| ---- | ---- | ------ | -------- | --------------------- |
| id   | path | string | true     | Template ID (for ref) |

#### Request Body

```yaml
Content-Type: application/json

DraftStrategyRequestDto:
  type: object
  required:
    - prompt
  properties:
    prompt:
      type: string
      minLength: 1
      maxLength: 2000
      description: Plain-English description of the question logic
      example: >
        Create a question where price is between 100 and 500, quantity is 
        an integer between 1 and 20, and total cost equals price times 
        quantity. The total must be a multiple of 100.
```

#### Responses

##### 200 OK - Success

```yaml
DraftStrategyResponseDto:
  type: object
  properties:
    success:
      type: boolean
      example: true
    data:
      type: object
      properties:
        variables:
          type: array
          items:
            $ref: '#/components/schemas/VariableDraftDto'
        derivedVariables:
          type: array
          items:
            $ref: '#/components/schemas/DerivedVariableDraftDto'
        constraints:
          type: array
          items:
            $ref: '#/components/schemas/ConstraintDraftDto'
        notes:
          type: array
          items:
            type: string
          description: AI notes about assumptions and decisions
    validationWarnings:
      type: array
      items:
        type: string
      description: List of validation warnings (if any)

# Example Response
{
  "success": true,
  "data": {
    "variables": [
      {
        "name": "price",
        "type": "number",
        "min": 100,
        "max": 500,
        "defaultValue": 300,
        "generator": "random"
      },
      {
        "name": "quantity",
        "type": "integer",
        "min": 1,
        "max": 20,
        "defaultValue": 10,
        "generator": "random"
      }
    ],
    "derivedVariables": [
      {
        "name": "total",
        "expression": "price * quantity"
      }
    ],
    "constraints": [
      {
        "rule": "total % 100 == 0",
        "severity": "error"
      }
    ],
    "notes": [
      "Created two base variables: price and quantity",
      "Derived total from multiplication",
      "Applied modulo constraint for multiples of 100"
    ]
  },
  "validationWarnings": []
}
```

##### 400 Bad Request

```yaml
ErrorResponse:
  type: object
  properties:
    success:
      type: boolean
      example: false
    error:
      type: string
      example: "Prompt exceeds maximum length (2000 characters)"
    statusCode:
      type: integer
      example: 400

# Examples:
# - "Prompt is empty or contains only whitespace"
# - "Prompt exceeds maximum length (2000 characters)"
```

##### 500 Internal Server Error

```yaml
ErrorResponse:
  type: object
  properties:
    success:
      type: boolean
      example: false
    error:
      type: string
      example: "Failed to generate strategy: OpenAI API rate limit exceeded"
    statusCode:
      type: integer
      example: 500

# Examples:
# - "Failed to generate strategy: OpenAI API error"
# - "LLM response parsing failed"
# - "Database error while processing strategy"
```

---

## Endpoint 2: Preview Strategy

### `POST /templates/{id}/ai/strategy/preview`

Validates a drafted strategy and shows it in structured form without making database changes.

#### Summary

Preview a strategy before applying

#### Description

Validates a drafted strategy and shows it in structured form without making changes to the template.

#### Parameters

| Name | In   | Type   | Required | Description           |
| ---- | ---- | ------ | -------- | --------------------- |
| id   | path | string | true     | Template ID (for ref) |

#### Request Body

```yaml
Content-Type: application/json

PreviewStrategyRequestDto:
  type: object
  required:
    - draft
  properties:
    draft:
      $ref: '#/components/schemas/StrategyDraftDto'

StrategyDraftDto:
  type: object
  required:
    - variables
    - derivedVariables
    - constraints
    - notes
  properties:
    variables:
      type: array
      items:
        $ref: '#/components/schemas/VariableDraftDto'
    derivedVariables:
      type: array
      items:
        $ref: '#/components/schemas/DerivedVariableDraftDto'
    constraints:
      type: array
      items:
        $ref: '#/components/schemas/ConstraintDraftDto'
    notes:
      type: array
      items:
        type: string

# Example Request Body
{
  "draft": {
    "variables": [
      {
        "name": "x",
        "type": "integer",
        "min": 10,
        "max": 50
      }
    ],
    "derivedVariables": [],
    "constraints": [
      {
        "rule": "x > 5",
        "severity": "error"
      }
    ],
    "notes": []
  }
}
```

#### Responses

##### 200 OK - Success

```yaml
PreviewStrategyResponseDto:
  type: object
  properties:
    success:
      type: boolean
      example: true
    preview:
      $ref: '#/components/schemas/StrategyDraftDto'
    warnings:
      type: array
      items:
        type: string
      description: List of validation warnings (does not prevent preview)

# Example Response
{
  "success": true,
  "preview": {
    "variables": [
      {
        "name": "price",
        "type": "number",
        "min": 100,
        "max": 500
      }
    ],
    "derivedVariables": [],
    "constraints": [],
    "notes": []
  },
  "warnings": [
    "No constraints defined. Generated values may not be optimally constrained.",
    "Derived variable 'complex_calc' uses expression 'x^2 * sin(y)' - verify compatibility with generation engine"
  ]
}
```

##### 400 Bad Request

```yaml
ErrorResponse:
  type: object
  properties:
    success:
      type: boolean
      example: false
    error:
      type: string
      example: "Invalid draft structure: variables must be an array"
    statusCode:
      type: integer
      example: 400
```

---

## Endpoint 3: Apply Strategy

### `POST /templates/{id}/ai/strategy/apply`

Applies a reviewed and edited strategy to the template, persisting it to the database.

#### Summary

Apply a drafted strategy to a template

#### Description

Applies the reviewed and potentially edited AI-drafted strategy to the template, persisting it to the database. Invalidates cache for the template.

#### Parameters

| Name | In   | Type   | Required | Description |
| ---- | ---- | ------ | -------- | ----------- |
| id   | path | string | true     | Template ID |

#### Request Body

```yaml
Content-Type: application/json

ApplyStrategyRequestDto:
  type: object
  required:
    - draft
  properties:
    draft:
      $ref: '#/components/schemas/StrategyDraftDto'

# Example Request Body
{
  "draft": {
    "variables": [
      {
        "name": "price",
        "type": "number",
        "min": 100,
        "max": 500,
        "defaultValue": 300
      }
    ],
    "derivedVariables": [
      {
        "name": "discount",
        "expression": "price * 0.1"
      }
    ],
    "constraints": [
      {
        "rule": "discount < price",
        "severity": "error"
      }
    ],
    "notes": [
      "AI-generated strategy for discount question"
    ]
  }
}
```

#### Responses

##### 200 OK - Success

```yaml
ApplyStrategyResponseDto:
  type: object
  properties:
    success:
      type: boolean
      example: true
    message:
      type: string
      example: "Strategy applied successfully"
    template:
      type: object
      properties:
        id:
          type: string
        variableSchema:
          type: object
          description: Updated variable schema
        constraints:
          type: object
          description: Updated constraints
        updatedAt:
          type: string
          format: date-time

# Example Response
{
  "success": true,
  "message": "Strategy applied successfully",
  "template": {
    "id": "template_123",
    "variableSchema": {
      "variables": [
        {
          "name": "price",
          "type": "number",
          "min": 100,
          "max": 500
        }
      ],
      "derivedVariables": [
        {
          "name": "discount",
          "expression": "price * 0.1"
        }
      ]
    },
    "constraints": {
      "constraints": [
        {
          "rule": "discount < price",
          "severity": "error"
        }
      ]
    },
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

##### 400 Bad Request

```yaml
# Missing or invalid draft
{ "success": false, "error": "Invalid draft structure", "statusCode": 400 }
```

##### 404 Not Found

```yaml
# Template doesn't exist
{ "success": false, "error": "Template not found", "statusCode": 404 }
```

##### 500 Internal Server Error

```yaml
{
  "success": false,
  "error": "Failed to apply strategy: Database error",
  "statusCode": 500,
}
```

---

## Shared Components/Schemas

### VariableDraftDto

```yaml
VariableDraftDto:
  type: object
  required:
    - name
    - type
  properties:
    name:
      type: string
      pattern: "^[a-zA-Z_][a-zA-Z0-9_]*$"
      minLength: 1
      maxLength: 50
      example: "price"
      description: Variable name (must be valid identifier)
    type:
      type: string
      enum: [number, integer, decimal, string, boolean]
      example: "number"
      description: Variable data type
    min:
      type: number
      nullable: true
      example: 100
      description: Minimum value (for numeric types)
    max:
      type: number
      nullable: true
      example: 500
      description: Maximum value (for numeric types)
    defaultValue:
      oneOf:
        - type: number
        - type: string
        - type: boolean
      nullable: true
      example: 300
      description: Default value if not provided
    generator:
      type: string
      enum: [random, sequential, custom]
      example: "random"
      description: Generation strategy
```

### DerivedVariableDraftDto

```yaml
DerivedVariableDraftDto:
  type: object
  required:
    - name
    - expression
  properties:
    name:
      type: string
      pattern: "^[a-zA-Z_][a-zA-Z0-9_]*$"
      example: "total"
      description: Derived variable name
    expression:
      type: string
      minLength: 1
      maxLength: 500
      example: "price * quantity"
      description: Mathematical expression (references base variables)
```

### ConstraintDraftDto

```yaml
ConstraintDraftDto:
  type: object
  required:
    - rule
  properties:
    rule:
      type: string
      minLength: 1
      maxLength: 200
      example: "total > 1000"
      description: Constraint rule as text
    severity:
      type: string
      enum: [error, warning]
      example: "error"
      description: Constraint severity level (default: error)
```

---

## Rate Limiting & Quotas

- **Draft Endpoint**: 10 requests per minute per user (enforced by OpenAI API rate limits)
- **Preview Endpoint**: 100 requests per minute
- **Apply Endpoint**: 50 requests per minute

### Rate Limit Headers

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1234567890
```

---

## Error Codes Reference

| Code | Meaning           | Example                               |
| ---- | ----------------- | ------------------------------------- |
| 400  | Bad Request       | Empty prompt, invalid draft structure |
| 401  | Unauthorized      | Missing JWT token                     |
| 403  | Forbidden         | Non-admin user trying to draft        |
| 404  | Not Found         | Template doesn't exist                |
| 429  | Too Many Requests | Rate limit exceeded                   |
| 500  | Server Error      | OpenAI API failure, database error    |

---

## Example Client Usage

### JavaScript/Node.js

```javascript
// Draft strategy
const draftResponse = await fetch("/templates/template_123/ai/strategy/draft", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    prompt:
      "Create variables for multiplication: a 10-99, b 10-99, result = a*b",
  }),
});

const draft = await draftResponse.json();
console.log(draft.data.variables); // Array of variables

// Preview the draft
const previewResponse = await fetch(
  "/templates/template_123/ai/strategy/preview",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ draft: draft.data }),
  },
);

const preview = await previewResponse.json();
if (preview.warnings.length > 0) {
  console.warn("Warnings:", preview.warnings);
}

// Apply the strategy
const applyResponse = await fetch("/templates/template_123/ai/strategy/apply", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ draft: draft.data }),
});

const result = await applyResponse.json();
console.log("Applied successfully:", result.success);
```

### cURL

```bash
# Draft
curl -X POST http://localhost:3000/templates/template_123/ai/strategy/draft \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create variables for multiplication"
  }'

# Preview
curl -X POST http://localhost:3000/templates/template_123/ai/strategy/preview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "draft": {
      "variables": [...],
      "derivedVariables": [],
      "constraints": [],
      "notes": []
    }
  }'

# Apply
curl -X POST http://localhost:3000/templates/template_123/ai/strategy/apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "draft": {...}
  }'
```

---

## Swagger UI

**Access Swagger UI at**: `http://localhost:3000/api/swagger`

All three endpoints are documented with interactive Try-it-out functionality.
