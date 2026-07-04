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
    const userAgent = (req as any).headers?.["user-agent"] as
      | string
      | undefined;
    const startTime = Date.now();
    const logger = this.logger;

    const originalSend = res.send as (body?: unknown) => unknown;
    res.send = function (this: unknown, data: unknown) {
      const duration = Date.now() - startTime;
      const statusCode = (res as { statusCode?: number }).statusCode || 200;
      const userId = (req as any).user?.id || (req as any).userId || null;

      // Extract error details if it's a failed response
      let errorDetails: any = null;
      try {
        if (typeof data === "string") {
          const parsed = JSON.parse(data);
          if (parsed && parsed.success === false) {
            errorDetails = parsed.error;
          }
        } else if (
          data &&
          typeof data === "object" &&
          (data as any).success === false
        ) {
          errorDetails = (data as any).error;
        }
      } catch (e) {
        // Silence errors on parsing static files/binary streams
      }

      logger.info(
        `[${method}] ${originalUrl} - Status: ${statusCode} - ${duration}ms`,
        {
          method,
          url: originalUrl,
          statusCode,
          durationMs: duration,
          ip,
          userAgent,
          userId,
          serviceName: "api",
          error: errorDetails,
        },
      );

      return originalSend.call(this, data);
    };

    next();
  }
}
