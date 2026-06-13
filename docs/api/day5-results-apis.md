# Day 5 MVP: Post-Assessment Intelligence Layer

This document describes the Day 5 API endpoints for the results module.

## Architecture

The module uses a strictly layered architecture:
`Controller -> Service -> Repository / Mapper -> DTO`

- **Controllers**: Thin wrappers handling routing and extracting inputs. No business logic.
- **Services**: Enforce domain rules, orchestration, and ownership validation.
- **Repositories**: Encapsulate Prisma queries. Use Prisma aggregates for performance.
- **Mappers**: Map database entities to strictly typed DTOs.

## API Flow

1. **Authentication**: All endpoints require a valid JWT token.
2. **Ownership Validation**: Results and recommendations are verified to belong to the requested user.
3. **Response Interceptor**: All responses are wrapped in a standard success envelope using `ResponseInterceptor`.

## Endpoints

### 1. Get Evaluation Result Details

- **Method**: GET
- **Path**: `/api/v1/results/:evaluationId`
- **Response**: `ResultResponseDto`
- **Errors**: `401 Unauthorized`, `403 Forbidden` (wrong owner), `404 Not Found`

### 2. Get Recommendations

- **Method**: GET
- **Path**: `/api/v1/results/:evaluationId/recommendations`
- **Response**: `RecommendationResponseDto[]`
- **Logic**: Recommendations are sorted dynamically: HIGH -> MEDIUM -> LOW.

### 3. Get Performance Summary

- **Method**: GET
- **Path**: `/api/v1/users/me/performance-summary`
- **Response**: `PerformanceSummaryResponseDto`
- **Logic**: Dynamically aggregates testsCompleted, averageScore, bestScore, and lastAssessmentDate from the database.

### 4. Get Assessment History

- **Method**: GET
- **Path**: `/api/v1/users/me/history`
- **Query**: `page` (optional), `limit` (optional)
- **Response**: `HistoryResponseDto`
- **Logic**: Returns a paginated list of all past evaluations.

## Testing Strategy

- **Unit Tests**: Focus on the Services, mocking Repositories. Validates domain logic and error throwing.
- **Integration Tests**: Tests the entire HTTP stack, Prisma interaction, and authentication flow using Supertest.

## Error Handling

The module throws domain-specific errors like `ResultNotFoundError` and `UnauthorizedResultAccessError` which are mapped to HTTP 404 and 403 respectively via the `GlobalExceptionFilter`.
