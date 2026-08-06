import { HttpException, HttpStatus } from "@nestjs/common";

export interface PreviewErrorDetails {
  category?: string;
  retryable?: boolean;
  source?: string;
  reason?: string;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

export class AppException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public code?: string,
    public details?: unknown,
  ) {
    super(
      {
        statusCode,
        message,
        code,
        details,
        timestamp: new Date().toISOString(),
      },
      statusCode,
    );
  }
}

export class ValidationException extends AppException {
  constructor(
    message: string,
    public errors?: Record<string, string[]>,
  ) {
    super(message, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR");
  }
}

export class NotFoundException extends AppException {
  constructor(message: string = "Resource not found") {
    super(message, HttpStatus.NOT_FOUND, "NOT_FOUND");
  }
}

export class UnauthorizedException extends AppException {
  constructor(message: string = "Unauthorized") {
    super(message, HttpStatus.UNAUTHORIZED, "UNAUTHORIZED");
  }
}

export class ForbiddenException extends AppException {
  constructor(message: string = "Forbidden") {
    super(message, HttpStatus.FORBIDDEN, "FORBIDDEN");
  }
}

export class ConflictException extends AppException {
  constructor(message: string = "Resource already exists") {
    super(message, HttpStatus.CONFLICT, "CONFLICT");
  }
}

export class PreviewGenerationException extends AppException {
  constructor(
    message: string = "Preview generation failed.",
    details: PreviewErrorDetails = {},
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, statusCode, "PREVIEW_GENERATION_ERROR", details);
  }
}
