import pino from "pino";
import { randomUUID } from "crypto";
import { getRequestContext } from "./request-context";

export interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  jobId?: string;
  queueName?: string;
  [key: string]: unknown;
}

export interface LoggerOptions {
  name: string;
  isDevelopment?: boolean;
  level?: string;
}

export class AppLogger {
  private logger: pino.Logger;
  private context: LogContext = {};

  constructor(options: LoggerOptions) {
    const isDev =
      options.isDevelopment ?? process.env.NODE_ENV === "development";

    const pinoOptions: pino.LoggerOptions = {
      name: options.name,
      level: options.level || process.env.LOG_LEVEL || "info",
      redact: {
        paths: [
          "password",
          "passwordHash",
          "token",
          "refreshToken",
          "authorization",
          "answers",
          "prompt",
          "OPENAI_API_KEY",
          "JWT_SECRET",
          "JWT_REFRESH_SECRET",
        ],
        censor: "[MASKED]",
      },
      transport: isDev
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          }
        : undefined,
    };

    // Explicitly write to process.stdout (file descriptor 1) in production so hosting environments (e.g. Render) treat logs as standard output
    this.logger = isDev
      ? pino(pinoOptions)
      : pino(pinoOptions, pino.destination(1));
  }

  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  getContext(): LogContext {
    return { ...this.context, ...getRequestContext() };
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.logger.info({ ...this.getContext(), ...(data || {}) }, message);
  }

  error(
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>,
  ): void {
    const errorData: Record<string, unknown> = {};
    if (error instanceof Error) {
      errorData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else if (typeof error === "object" && error !== null) {
      errorData.error = error;
    } else if (error !== undefined) {
      errorData.error = { message: String(error) };
    }

    this.logger.error(
      { ...this.getContext(), ...errorData, ...(data || {}) },
      message,
    );
  }

  warn(
    message: string,
    dataOrError?: Record<string, unknown> | Error | unknown,
    data?: Record<string, unknown>,
  ): void {
    if (dataOrError instanceof Error) {
      const errorData = {
        error: {
          message: dataOrError.message,
          name: dataOrError.name,
        },
      };
      this.logger.warn(
        { ...this.getContext(), ...errorData, ...(data || {}) },
        message,
      );
    } else if (typeof dataOrError === "object" && dataOrError !== null) {
      this.logger.warn(
        { ...this.getContext(), ...dataOrError, ...(data || {}) },
        message,
      );
    } else {
      this.logger.warn({ ...this.getContext(), ...(data || {}) }, message);
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.logger.debug({ ...this.getContext(), ...(data || {}) }, message);
  }

  trace(message: string, data?: Record<string, unknown>): void {
    this.logger.trace({ ...this.getContext(), ...(data || {}) }, message);
  }

  fatal(
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>,
  ): void {
    const errorData: Record<string, unknown> = {};
    if (error instanceof Error) {
      errorData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else if (typeof error === "object" && error !== null) {
      errorData.error = error;
    } else if (error !== undefined) {
      errorData.error = { message: String(error) };
    }

    this.logger.fatal(
      { ...this.getContext(), ...errorData, ...(data || {}) },
      message,
    );
  }

  generateCorrelationId(): string {
    return randomUUID();
  }

  generateRequestId(): string {
    return randomUUID();
  }

  generateJobId(): string {
    return randomUUID();
  }
}
