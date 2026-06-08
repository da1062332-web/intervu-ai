export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONTRACT_ERROR = "CONTRACT_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export class BaseError extends Error {
  constructor(
    public readonly code: ErrorCode | string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ContractViolationError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.CONTRACT_ERROR, message, details);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, message, details);
  }
}
