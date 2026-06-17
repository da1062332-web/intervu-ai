import { BaseError, ErrorCode } from "./base.errors";

/**
 * Thrown when a requested user record cannot be located.
 * GlobalExceptionFilter maps code "NOT_FOUND" → HTTP 404.
 */
export class UserNotFoundError extends BaseError {
  constructor(message = "User not found") {
    super(ErrorCode.NOT_FOUND, message);
  }
}

/**
 * Thrown when a requested test config / template cannot be located.
 * GlobalExceptionFilter maps code "NOT_FOUND" → HTTP 404.
 */
export class ConfigNotFoundError extends BaseError {
  constructor(message = "Config not found") {
    super(ErrorCode.NOT_FOUND, message);
  }
}

/**
 * Thrown for domain-level authorisation failures distinct from JWT guard rejections.
 * GlobalExceptionFilter maps code "UNAUTHORIZED" → HTTP 401.
 */
export class UnauthorizedDomainError extends BaseError {
  constructor(message = "Unauthorized") {
    super(ErrorCode.UNAUTHORIZED, message);
  }
}

/**
 * Thrown for unexpected internal failures that must not leak implementation details.
 * GlobalExceptionFilter maps unrecognised codes → HTTP 400 by default;
 * use this only when you must surface a domain-level failure explicitly.
 */
export class InternalDomainError extends BaseError {
  constructor(message = "An internal error occurred") {
    super(ErrorCode.INTERNAL_ERROR, message);
  }
}

/**
 * Thrown when a requested evaluation result cannot be located.
 */
export class ResultNotFoundError extends BaseError {
  constructor(message = "Evaluation result not found") {
    super(ErrorCode.NOT_FOUND, message);
  }
}

/**
 * Thrown when a requested recommendation cannot be located.
 */
export class RecommendationNotFoundError extends BaseError {
  constructor(message = "Recommendation not found") {
    super(ErrorCode.NOT_FOUND, message);
  }
}

/**
 * Thrown when a user's performance summary cannot be located.
 */
export class PerformanceSummaryNotFoundError extends BaseError {
  constructor(message = "Performance summary not found") {
    super(ErrorCode.NOT_FOUND, message);
  }
}

/**
 * Thrown when a user attempts to access an evaluation result they do not own.
 */
export class UnauthorizedResultAccessError extends BaseError {
  constructor(message = "Unauthorized access to evaluation result") {
    super(ErrorCode.FORBIDDEN, message);
  }
}

/**
 * Thrown when an invalid combination of rule flags is provided.
 */
export class RuleCombinationError extends BaseError {
  constructor(message = "Invalid rule combination") {
    super(ErrorCode.INVALID_RULE_COMBINATION, message);
  }
}
