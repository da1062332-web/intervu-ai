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
