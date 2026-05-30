import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  requestId?: string;
  jobId?: string;
  queueName?: string;
  [key: string]: any;
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
    return this.context;
  }

  info(message: string, data?: any): void {
    this.logger.info({ ...this.context, ...data }, message);
  }

  error(message: string, error?: Error | any, data?: any): void {
    const errorData = error instanceof Error ? { error: error.message, stack: error.stack } : error;
    this.logger.error({ ...this.context, ...errorData, ...data }, message);
  }

  warn(message: string, data?: any): void {
    this.logger.warn({ ...this.context, ...data }, message);
  }

  debug(message: string, data?: any): void {
    this.logger.debug({ ...this.context, ...data }, message);
  }

  trace(message: string, data?: any): void {
    this.logger.trace({ ...this.context, ...data }, message);
  }

  fatal(message: string, error?: Error | any, data?: any): void {
    const errorData = error instanceof Error ? { error: error.message, stack: error.stack } : error;
    this.logger.fatal({ ...this.context, ...errorData, ...data }, message);
  }

  generateCorrelationId(): string {
    return uuidv4();
  }

  generateRequestId(): string {
    return uuidv4();
  }

  generateJobId(): string {
    return uuidv4();
  }
}
