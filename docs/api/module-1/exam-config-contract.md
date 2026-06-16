# Exam Config Contract

## API Wrapper Format

All responses use the standard `ApiResponseSchema` wrapper:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

## Endpoints

### POST /api/v1/admin/configs

Create a new exam configuration.

**Request Example:**

```json
{
  "name": "Software Engineer Screening",
  "role": "Software Engineer",
  "durationMinutes": 60,
  "totalQuestions": 30
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Software Engineer Screening",
    "role": "Software Engineer",
    "durationMinutes": 60,
    "totalQuestions": 30,
    "isActive": true,
    "createdAt": "2026-06-16T12:00:00Z",
    "updatedAt": "2026-06-16T12:00:00Z"
  }
}
```

### GET /api/v1/admin/configs

Retrieve a list of exam configurations.

**Request Example:**
No body.

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Software Engineer Screening",
      "role": "Software Engineer",
      "durationMinutes": 60,
      "totalQuestions": 30,
      "isActive": true,
      "createdAt": "2026-06-16T12:00:00Z",
      "updatedAt": "2026-06-16T12:00:00Z"
    }
  ]
}
```

### GET /api/v1/admin/configs/:id

Retrieve a specific exam configuration.

**Request Example:**
No body.

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Software Engineer Screening",
    "role": "Software Engineer",
    "durationMinutes": 60,
    "totalQuestions": 30,
    "isActive": true,
    "createdAt": "2026-06-16T12:00:00Z",
    "updatedAt": "2026-06-16T12:00:00Z"
  }
}
```
