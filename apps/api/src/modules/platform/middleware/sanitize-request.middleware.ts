import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class SanitizeRequestMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.body) {
      req.body = this.sanitize(req.body) as typeof req.body;
    }
    if (req.query) {
      req.query = this.sanitize(req.query) as typeof req.query;
    }
    if (req.params) {
      req.params = this.sanitize(req.params) as typeof req.params;
    }
    next();
  }

  private sanitize(obj: unknown): unknown {
    if (typeof obj !== "object" || obj === null) {
      if (typeof obj === "string") {
        return this.cleanString(obj);
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item: unknown) => this.sanitize(item));
    }

    const rawObj = obj as Record<string, unknown>;
    const sanitizedObj: Record<string, unknown> = {};
    for (const key of Object.keys(rawObj)) {
      sanitizedObj[key] = this.sanitize(rawObj[key]);
    }
    return sanitizedObj;
  }

  private cleanString(str: string): string {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/<[^>]*>/g, "")
      .trim();
  }
}
