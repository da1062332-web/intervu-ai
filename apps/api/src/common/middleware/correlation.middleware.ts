import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { requestContextStorage } from "@intervu-ai/shared-logger";

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generate only if absent
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();

    req.headers["x-request-id"] = requestId;
    res.setHeader("x-request-id", requestId);

    // Only set requestId in context
    requestContextStorage.run({ requestId, correlationId: requestId }, () => {
      next();
    });
  }
}
