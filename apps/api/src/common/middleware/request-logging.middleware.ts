import { Injectable, NestMiddleware } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new AppLogger({ name: "RequestLogging" });

  use(req: Request, res: Response, next: NextFunction) {
    const method = req.method;
    const originalUrl = req.originalUrl || req.url;
    const ip = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers?.["user-agent"] as string | undefined;
    const startTime = Date.now();
    const logger = this.logger;

    let errorDetails: unknown = null;

    // Capture error details from response body if sent as JSON with failure payload
    const originalSend = res.send;
    res.send = function (this: Response, data: any) {
      try {
        if (typeof data === "string") {
          const parsed = JSON.parse(data);
          if (parsed && (parsed.success === false || parsed.error)) {
            errorDetails = parsed.error || parsed.message;
          }
        } else if (data && typeof data === "object") {
          if (data.success === false || data.error) {
            errorDetails = data.error || data.message;
          }
        }
      } catch {
        // Silence parse errors on non-JSON/binary payloads
      }
      return originalSend.call(this, data);
    };

    let logged = false;
    const logResponse = () => {
      if (logged) return;
      logged = true;

      const duration = Date.now() - startTime;
      const statusCode = res.statusCode || 200;
      const userId = (req as any).user?.id || (req as any).userId || undefined;
      const requestId =
        (req.headers["x-request-id"] as string) ||
        (req.headers["x-correlation-id"] as string) ||
        (typeof res.getHeader === "function"
          ? (res.getHeader("x-request-id") as string)
          : undefined) ||
        undefined;

      const message = `[${method}] ${originalUrl} - ${statusCode} - ${duration}ms`;

      const logData: Record<string, unknown> = {
        method,
        url: originalUrl,
        statusCode,
        durationMs: duration,
        serviceName: "api",
      };

      if (requestId) logData.requestId = requestId;
      if (userId) logData.userId = userId;
      if (ip) logData.ip = ip;
      if (userAgent) logData.userAgent = userAgent;

      // Classify logs strictly according to HTTP status code:
      // 500-599 -> ERROR
      // 400-499 -> WARN
      // 200-399 -> INFO (or WARN if body contains explicit failure)
      if (statusCode >= 500) {
        if (errorDetails) {
          logData.error = errorDetails;
        }
        logger.error(message, undefined, logData);
      } else if (statusCode >= 400) {
        if (errorDetails) {
          logData.error = errorDetails;
        }
        logger.warn(message, logData);
      } else {
        if (errorDetails) {
          logData.error = errorDetails;
          logger.warn(`[UNEXPECTED 200 WITH ERROR] ${message}`, logData);
        } else {
          // 2xx, 3xx: Successful requests. NEVER attach "error" property (prevents Render red flagging).
          if (duration >= 5000) {
            logData.isSlow = true;
          }
          logger.info(message, logData);
        }
      }
    };

    res.on("finish", logResponse);
    res.on("close", logResponse);

    next();
  }
}

