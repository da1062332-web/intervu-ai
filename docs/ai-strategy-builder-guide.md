# AI-Assisted Strategy Builder - Complete Setup & Walkthrough Guide

## Table of Contents
1. [Local Environment Setup](#local-environment-setup)
2. [Running Backend & Frontend](#running-backend--frontend)
3. [Feature Walkthrough](#feature-walkthrough)
4. [API Documentation](#api-documentation)
5. [Example Prompts](#example-prompts)
6. [Troubleshooting](#troubleshooting)

---

## Local Environment Setup

### Prerequisites
- **Node.js**: v18.0+ (check with `node --version`)
- **npm**: v9.0+ (check with `npm --version`)
- **PostgreSQL**: v12+ running locally or accessible
- **OpenAI API Key**: Required for AI-assisted drafting (set via `OPENAI_API_KEY` env var)

### Step 1: Clone & Install Dependencies

```bash
cd c:\code\intervu-ai
npm install
```

### Step 2: Configure Environment Variables

Create `.env.local` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/intervu_ai"

# OpenAI API
OPENAI_API_KEY="sk-your-openai-key-here"
OPENAI_MODEL="gpt-4o"

# Backend
NODE_ENV="development"
API_PORT=3000
API_URL="http://localhost:3000"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### Step 3: Setup Database

```bash
# Generate Prisma Client
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database with test data
npx prisma db seed
```

---

## Running Backend & Frontend

### Terminal 1: Start Backend API

```bash
cd apps/api
npm run dev
```

**Expected output:**
```
[Nest] 12345  - 01/15/2025 10:30:00     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 01/15/2025 10:30:02     LOG [InstanceLoader] GenerationAiModule dependencies initialized
[Nest] 12345  - 01/15/2025 10:30:03     LOG [NestFactory] Nest application successfully started
[Nest] 12345  - 01/15/2025 10:30:03     LOG Listening on port 3000. Go to http://localhost:3000/api
```

Backend runs on: **http://localhost:3000**

### Terminal 2: Start Frontend Web App

```bash
cd apps/web
npm run dev
```

**Expected output:**
```
▲ Next.js 16.2.10
- Local:        http://localhost:3001
- Environments: .env.local

✓ Ready in 2.1s
```

Frontend runs on: **http://localhost:3001**

### Terminal 3 (Optional): Watch API Schema

For real-time Swagger documentation updates:

```bash
cd apps/api
npm run swagger:generate
```

---

## Feature Walkthrough

### Accessing the Feature

1. Open **http://localhost:3001** in your browser
2. Log in with admin credentials
3. Navigate to **Admin Dashboard** → **Templates**
4. Click on any existing template or create a new one
5. Scroll down to **"Generation Strategy"** section

### UI Layout

The Generation Strategy section has three main areas:

```
┌─────────────────────────────────────────────────────────────┐
│ GENERATION STRATEGY                                         │
│ Define the deterministic variable strategy for this         │
│ template, including derived values and validation rules.    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ⚡ AI-Assisted Strategy Builder                             │
│ Describe your question logic in simple English, and let    │
│ the AI draft the variable and constraint structure.        │
│                                                              │
│ Describe your logic                                         │
│ ┌──────────────────────────────────────────────────────────┐
│ │ Example: Create a question where price is between 100   │
│ │ and 500, quantity is 1-20, and total cost equals price  │
│ │ times quantity...                                        │
│ └──────────────────────────────────────────────────────────┘
│                                                              │
│ [Generate Draft]  [Use Manual Editor Instead]              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Manual Editor                                               │
│ Create and manage variables, derived variables, and        │
│ constraints manually.                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Variables                                                   │
│ Define the base inputs used in the question and solution   │
│ logic.                                                      │
│                                                              │
│ ┌──────┬──────────┬──────────────┬─────────┐               │
│ │ Name │ Type     │ Range/Value  │ Actions │               │
│ ├──────┼──────────┼──────────────┼─────────┤               │
│ │      │          │              │ + Add   │               │
│ └──────┴──────────┴──────────────┴─────────┘               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Constraints                                                 │
│ Define the numeric or logical conditions that the          │
│ generated values must satisfy.                             │
│                                                              │
│ ┌──────────┬──────────┬──────────┬─────────┐               │
│ │ Target   │ Operator │ Value    │ Actions │               │
│ ├──────────┼──────────┼──────────┼─────────┤               │
│ │          │          │          │ + Add   │               │
│ └──────────┴──────────┴──────────┴─────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Step-by-Step: Using AI-Assisted Builder

#### Step 1: Describe Your Logic

In the **"Describe your logic"** textarea, write a natural English description of your question logic:

```
Create a question where:
- price ranges from 100 to 500 (increments of 10)
- quantity is an integer between 1 and 20
- total_cost = price * quantity
- total_cost must be greater than 500
- Make sure quantity and price are coprime (no common factors)
```

#### Step 2: Generate Draft

Click **"Generate Draft"** button. The AI will process your description and return:

**Loading State:**
- Button shows spinning loader
- Text area is disabled
- Wait for response (typically 2-5 seconds)

**Success Response:**
The page transitions to the **"Review & Edit Draft"** panel showing:

```
┌──────────────────────────────────────────────────────────┐
│ ✓ Review & Edit Draft                                    │
│ Review the AI-generated structure. You can edit any item │
│ before applying.                                          │
│                                                            │
│ ⚠ Validation Notes:                                      │
│   • Derived variable 'coprime_check' uses complex        │
│     expression - verify it's compatible with your        │
│     generation engine                                     │
│   • No warnings for basic constraints                    │
│                                                            │
│ Variables (3)                    [+ Add More]             │
│ ┌──────────────┬────────┬────────────┬────────┐          │
│ │ Name         │ Type   │ Range      │ Action │          │
│ ├──────────────┼────────┼────────────┼────────┤          │
│ │ price        │ number │ 100 - 500  │ ✎ ✕   │          │
│ │ quantity     │ integer│ 1 - 20     │ ✎ ✕   │          │
│ │ total_cost   │ number │ —          │ ✎ ✕   │          │
│ └──────────────┴────────┴────────────┴────────┘          │
│                                                            │
│ Constraints (2)                  [+ Add More]             │
│ ┌────────────────────────────────────┬────────┐          │
│ │ Rule                               │ Action │          │
│ ├────────────────────────────────────┼────────┤          │
│ │ total_cost > 500                   │ ✎ ✕   │          │
│ │ coprime_check(price, quantity)=true│ ✎ ✕   │          │
│ └────────────────────────────────────┴────────┘          │
│                                                            │
│ [Apply to Template]  [Discard & Start Over]              │
└──────────────────────────────────────────────────────────┘
```

#### Step 3: Review & Edit Items

##### Editing a Variable:

Click the **✎ (Edit)** icon on any variable:

```
┌─────────────────────────────────────┐
│ Edit Variable                       │
├─────────────────────────────────────┤
│ Variable Name                       │
│ ┌─────────────────────────────────┐ │
│ │ price                           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Type                                │
│ ┌─────────────────────────────────┐ │
│ │ ▼ number    [integer, decimal]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Min                  Max            │
│ ┌──────────────┐  ┌──────────────┐ │
│ │ 100          │  │ 500          │ │
│ └──────────────┘  └──────────────┘ │
│                                     │
│ [Cancel]  [Save]                    │
└─────────────────────────────────────┘
```

- Modify any field as needed
- Click **Save** to update the draft
- Changes are temporary until you click "Apply to Template"

##### Deleting an Item:

Click the **✕ (Delete)** icon to remove from draft. A toast notification confirms removal.

##### Adding More Items:

Click **"+ Add More"** to manually add additional variables or constraints to the draft before applying.

#### Step 4: Apply to Template

Once satisfied with the draft:

1. Click **"Apply to Template"** button
2. Button shows loading state (spinner)
3. Backend validates and applies the strategy

**Success:**
- Toast notification: "Strategy applied successfully!"
- Page reloads with new variables/constraints in manual editor
- AI section resets for new drafts

**Error:**
- Toast shows error message
- Draft remains editable
- Can try fixing and re-applying

---

### Step-by-Step: Using Manual Editor

If you prefer not to use AI assistance:

#### Option A: Skip AI Entirely

Click **"Use Manual Editor Instead"** in the AI section → AI section collapses

#### Option B: Edit After AI Draft

After applying AI draft, the manual editor updates with the generated values. You can further customize:

#### Adding a Variable Manually:

1. Click **"+ Add Variable"** button
2. Fill form:
   - **Name**: `discount_percent`
   - **Type**: `number`
   - **Min**: `0`
   - **Max**: `50`
3. Click **Save**

Variable appears in table immediately and is persisted to the template.

#### Adding a Constraint Manually:

1. Click **"+ Add Constraint"** button
2. Fill form:
   - **Target Variable**: `total_cost`
   - **Operator**: `>=`
   - **Value**: `1000`
3. Click **Save**

Constraint is added and persisted.

#### Editing Manual Entries:

Same process as editing AI-generated items - click ✎ icon on any row.

#### Deleting Manual Entries:

Click ✕ icon to remove from template.

---

## API Documentation

### Authentication

All endpoints require:
- **Authorization Header**: `Bearer {jwt_token}`
- **Admin Role**: Only users with `ADMIN` role can access these endpoints

### Endpoint 1: Draft Strategy

**Request:**
```http
POST /templates/:id/ai/strategy/draft
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "prompt": "Create a pricing question where price ranges from 100-500, quantity from 1-20, and total equals price times quantity"
}
```

**Response (Success - 200 OK):**
```json
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
        "rule": "total > 100",
        "severity": "error"
      }
    ],
    "notes": [
      "Derived total from price and quantity multiplication",
      "Total constraint ensures meaningful values"
    ]
  },
  "validationWarnings": []
}
```

**Response (Error - 400 Bad Request):**
```json
{
  "success": false,
  "error": "Prompt exceeds maximum length (2000 characters)",
  "statusCode": 400
}
```

**Response (Error - 500 Server Error):**
```json
{
  "success": false,
  "error": "Failed to generate strategy: OpenAI API rate limit exceeded",
  "statusCode": 500
}
```

### Endpoint 2: Preview Strategy

**Request:**
```http
POST /templates/:id/ai/strategy/preview
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "draft": {
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
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "preview": {
    "variables": [...],
    "derivedVariables": [...],
    "constraints": [...],
    "notes": [...]
  },
  "warnings": [
    "Constraint 'unknown_var > 10' references undefined variable: unknown_var"
  ]
}
```

### Endpoint 3: Apply Strategy

**Request:**
```http
POST /templates/:id/ai/strategy/apply
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "draft": {
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
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Strategy applied successfully",
  "template": {
    "id": "template_123",
    "variableSchema": {
      "variables": [...],
      "derivedVariables": [...]
    },
    "constraints": {
      "constraints": [...]
    },
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

**Response (Error - 404 Not Found):**
```json
{
  "success": false,
  "error": "Template not found",
  "statusCode": 404
}
```

---

## Example Prompts

### Example 1: Simple Math Question

**Prompt:**
```
Create variables for a multiplication question:
- Two numbers called 'a' and 'b'
- 'a' ranges from 10 to 99
- 'b' ranges from 10 to 99
- result = a * b
- result must be less than 5000
```

**Expected Draft:**
```json
{
  "variables": [
    {"name": "a", "type": "integer", "min": 10, "max": 99},
    {"name": "b", "type": "integer", "min": 10, "max": 99}
  ],
  "derivedVariables": [
    {"name": "result", "expression": "a * b"}
  ],
  "constraints": [
    {"rule": "result < 5000", "severity": "error"}
  ]
}
```

### Example 2: Financial Calculation

**Prompt:**
```
Design a compound interest question with these variables:
- principal: starting amount between 1000 and 10000
- rate: annual interest rate 3% to 8%
- years: time period from 1 to 20 years
- compound_amount = principal * (1 + rate/100)^years
```

**Expected Draft:**
```json
{
  "variables": [
    {"name": "principal", "type": "number", "min": 1000, "max": 10000},
    {"name": "rate", "type": "decimal", "min": 3, "max": 8},
    {"name": "years", "type": "integer", "min": 1, "max": 20}
  ],
  "derivedVariables": [
    {"name": "compound_amount", "expression": "principal * pow(1 + rate/100, years)"}
  ],
  "constraints": []
}
```

### Example 3: Complex Business Logic

**Prompt:**
```
Create a e-commerce pricing question:
- product_price between $50 and $500
- quantity between 1 and 100 units
- discount_percent between 0-30% based on quantity (10% if qty>50, else 0%)
- tax_rate is 8%
- final_price = (product_price * quantity * (1 - discount_percent/100)) * (1 + tax_rate/100)
- Constraint: final_price must be between $50 and $5000
```

**Expected Draft:**
```json
{
  "variables": [
    {"name": "product_price", "type": "number", "min": 50, "max": 500},
    {"name": "quantity", "type": "integer", "min": 1, "max": 100},
    {"name": "tax_rate", "type": "decimal", "min": 8, "max": 8}
  ],
  "derivedVariables": [
    {"name": "discount_percent", "expression": "quantity > 50 ? 10 : 0"},
    {"name": "subtotal", "expression": "product_price * quantity * (1 - discount_percent/100)"},
    {"name": "final_price", "expression": "subtotal * (1 + tax_rate/100)"}
  ],
  "constraints": [
    {"rule": "final_price >= 50", "severity": "error"},
    {"rule": "final_price <= 5000", "severity": "error"}
  ]
}
```

### Example 4: Physics/Science Question

**Prompt:**
```
Create physics question variables for kinematics:
- initial_velocity (u): 0 to 50 m/s
- acceleration (a): 1 to 10 m/s²
- time (t): 0.5 to 10 seconds
- distance = u*t + 0.5*a*t²
- final_velocity = u + a*t
```

**Expected Draft:**
```json
{
  "variables": [
    {"name": "initial_velocity", "type": "number", "min": 0, "max": 50},
    {"name": "acceleration", "type": "number", "min": 1, "max": 10},
    {"name": "time", "type": "decimal", "min": 0.5, "max": 10}
  ],
  "derivedVariables": [
    {"name": "distance", "expression": "initial_velocity * time + 0.5 * acceleration * pow(time, 2)"},
    {"name": "final_velocity", "expression": "initial_velocity + acceleration * time"}
  ],
  "constraints": []
}
```

---

## Troubleshooting

### Common Issues

#### Issue: "OpenAI API error" when generating draft

**Causes:**
- Missing or invalid `OPENAI_API_KEY` in `.env.local`
- API rate limit exceeded
- OpenAI service is down

**Solution:**
1. Verify API key is set: `echo $env:OPENAI_API_KEY` (Windows PowerShell)
2. Check OpenAI status at https://status.openai.com
3. Wait a few minutes and retry
4. Use manual editor as fallback

#### Issue: "No variables in draft" after generation

**Causes:**
- Prompt was too vague or unclear
- LLM didn't generate valid JSON

**Solution:**
1. Be more specific in your prompt
2. Include exact variable names
3. Specify ranges explicitly (e.g., "between 10 and 20")
4. Use manual editor to add variables manually

#### Issue: Backend not accessible at http://localhost:3000

**Causes:**
- Backend not started
- Backend running on different port
- Port 3000 already in use

**Solution:**
```bash
# Check if backend is running
ps aux | grep "nest"

# If port 3000 is in use, find what's using it
lsof -i :3000

# Kill process using port 3000
kill -9 <PID>

# Restart backend
cd apps/api && npm run dev
```

#### Issue: Frontend shows "Failed to connect to API"

**Causes:**
- Backend not running
- CORS configuration issue
- Wrong API URL in `.env.local`

**Solution:**
1. Ensure backend is running on http://localhost:3000
2. Check `NEXT_PUBLIC_API_URL` in `.env.local` points to `http://localhost:3000`
3. Verify network connectivity
4. Check browser console for detailed errors

#### Issue: Changes not persisting after "Apply to Template"

**Causes:**
- Database connection issue
- Permission/RBAC issue
- Validation error on backend

**Solution:**
1. Check backend logs for validation errors
2. Verify you're logged in as admin
3. Refresh page to see latest state
4. Check database connection: `npx prisma db execute --stdin`

#### Issue: "Validation Notes" show undefined variable warnings

**Causes:**
- Derived variables reference non-existent base variables
- Constraints reference undefined variables

**Solution:**
1. Review the warnings carefully
2. Edit the variable/constraint to fix the reference
3. Ensure all variables you reference are defined
4. Use consistent naming (case-sensitive)

---

## Performance Optimization

### For Faster AI Drafts:

1. **Be Specific**: More detailed prompts generate better results
2. **Use Short Names**: Shorter variable names process faster
3. **Limit Scope**: Focus on one aspect per prompt

### For Better Constraint Parsing:

1. **Use Standard Operators**: `>`, `<`, `>=`, `<=`, `==`, `!=`
2. **Simple Expressions**: Avoid complex nested logic in constraints
3. **One Rule Per Constraint**: Don't combine multiple conditions in one rule

---

## Support & Feedback

For issues, questions, or feature requests:

1. Check this guide's **Troubleshooting** section
2. Review **Example Prompts** for reference implementations
3. Contact the development team with:
   - Your prompt
   - Expected output
   - Actual output
   - Browser console errors (if any)

