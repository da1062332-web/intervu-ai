import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { requestContextStorage } from "@intervu-ai/shared-logger";

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();
    const correlationId =
      (req.headers["x-correlation-id"] as string) || randomUUID();

    req.headers["x-request-id"] = requestId;
    req.headers["x-correlation-id"] = correlationId;

    // Setting in response so frontend gets it too
    res.setHeader("x-request-id", requestId);
    res.setHeader("x-correlation-id", correlationId);

    requestContextStorage.run({ requestId, correlationId }, () => {
      next();
    });
  }
}
