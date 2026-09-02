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


export class TemplateGenerationException extends HttpException {
  constructor(
    message: string,
    public stage: string,
    public field: string,
    public code: string,
    public templateId?: string,
    public patternId?: string,
  ) {
    super(
      {
        error_code: code,
        template_id: templateId,
        pattern_id: patternId,
        stage,
        field,
        message,
      },
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }
}

export class VariableGenerationError extends TemplateGenerationException {
  constructor(message: string, field: string = "variables", templateId?: string, patternId?: string) {
    super(message, "variable_generation", field, "VARIABLE_GENERATION_FAILED", templateId, patternId);
  }
}

export class ConstraintValidationError extends TemplateGenerationException {
  constructor(message: string, field: string = "constraints", templateId?: string, patternId?: string) {
    super(message, "constraint_validation", field, "CONSTRAINT_UNSATISFIABLE", templateId, patternId);
  }
}

export class FormulaEvaluationError extends TemplateGenerationException {
  constructor(message: string, field: string = "formulas", templateId?: string, patternId?: string) {
    super(message, "formula_evaluation", field, "FORMULA_EVALUATION_ERROR", templateId, patternId);
  }
}

export class DistractorGenerationError extends TemplateGenerationException {
  constructor(message: string, field: string = "option_strategy", templateId?: string, patternId?: string) {
    super(message, "distractor_generation", field, "DISTRACTOR_GENERATION_FAILED", templateId, patternId);
  }
}
