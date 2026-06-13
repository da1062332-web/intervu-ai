import { Injectable, NestMiddleware } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new AppLogger({ name: "RequestLogging" });

  use(
    req: Record<string, unknown>,
    res: Record<string, unknown>,
    next: () => void,
  ) {
    const method = req.method as string;
    const originalUrl = req.originalUrl as string;
    const ip = req.ip as string;
    const startTime = Date.now();
    const logger = this.logger;

    const originalSend = res.send as (body?: unknown) => unknown;
    res.send = function (this: unknown, data: unknown) {
      const duration = Date.now() - startTime;
      const statusCode = (res as { statusCode?: number }).statusCode;

      logger.info(
        `[${method}] ${originalUrl} - Status: ${statusCode} - ${duration}ms`,
        {
          method,
          url: originalUrl,
          statusCode,
          durationMs: duration,
          ip,
        },
      );

      return originalSend.call(this, data);
    };

    next();
  }
}
