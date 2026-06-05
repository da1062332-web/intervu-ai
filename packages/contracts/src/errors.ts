export enum PipelineErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  PIPELINE_ERROR = "PIPELINE_ERROR",
  QUEUE_ERROR = "QUEUE_ERROR",
  AI_ERROR = "AI_ERROR",
}

export class PipelineBaseError extends Error {
  constructor(
    public readonly code: PipelineErrorCode | string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class PipelineError extends PipelineBaseError {
  constructor(message: string, details?: unknown) {
    super(PipelineErrorCode.PIPELINE_ERROR, message, details);
  }
}

export class ValidationError extends PipelineBaseError {
  constructor(message: string, details?: unknown) {
    super(PipelineErrorCode.VALIDATION_ERROR, message, details);
  }
}

export class QueueError extends PipelineBaseError {
  constructor(message: string, details?: unknown) {
    super(PipelineErrorCode.QUEUE_ERROR, message, details);
  }
}

export class AIError extends PipelineBaseError {
  constructor(message: string, details?: unknown) {
    super(PipelineErrorCode.AI_ERROR, message, details);
  }
}
