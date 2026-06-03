import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Record<string, unknown>, res: Record<string, unknown>, next: () => void) {
    const method = req.method as string;
    const originalUrl = req.originalUrl as string;
    const ip = req.ip as string;
    const startTime = Date.now();
    const logger = this.logger;

    const originalSend = res.send as (body?: unknown) => unknown;
    res.send = function (this: unknown, data: unknown) {
      const duration = Date.now() - startTime;
      const statusCode = (res as { statusCode?: number }).statusCode;

      logger.log(
        `[${method}] ${originalUrl} - Status: ${statusCode} - ${duration}ms - IP: ${ip}`,
      );

      return originalSend.call(this, data);
    };

    next();
  }
}
