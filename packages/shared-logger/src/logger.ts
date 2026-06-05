import pino from 'pino';
import { randomUUID } from 'crypto';
import { getRequestContext } from './request-context';

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
    const isDev = options.isDevelopment ?? process.env.NODE_ENV === 'development';

    this.logger = pino({
      name: options.name,
      level: options.level || 'info',
      transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    });
  }

  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  getContext(): LogContext {
    return { ...this.context, ...getRequestContext() };
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.logger.info({ ...this.getContext(), ...data }, message);
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData = error instanceof Error 
      ? { error: error.message, stack: error.stack } 
      : (typeof error === 'object' && error !== null ? error : { error });
    this.logger.error({ ...this.getContext(), ...errorData, ...data }, message);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.logger.warn({ ...this.getContext(), ...data }, message);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.logger.debug({ ...this.getContext(), ...data }, message);
  }

  trace(message: string, data?: Record<string, unknown>): void {
    this.logger.trace({ ...this.getContext(), ...data }, message);
  }

  fatal(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData = error instanceof Error 
      ? { error: error.message, stack: error.stack } 
      : (typeof error === 'object' && error !== null ? error : { error });
    this.logger.fatal({ ...this.getContext(), ...errorData, ...data }, message);
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
