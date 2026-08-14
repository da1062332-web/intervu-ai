import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

const CODE_OR_RAW_KEYS = new Set([
  "code",
  "sourcecode",
  "startercode",
  "solutioncode",
  "referencesolution",
  "testcases",
  "publictests",
  "hiddentests",
  "stresstests",
  "boundarytests",
  "input",
  "expectedoutput",
  "parameterschema",
  "constraintschema",
  "narrative",
  "description",
  "content",
  "markdown",
  "query",
  "sql",
  "statement",
  "prompt",
  "template",
]);

@Injectable()
export class SanitizeRequestMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Skip sanitization for coding execution / compiler endpoints
    const path = req.baseUrl || req.path || "";
    const pathLower = path.toLowerCase();
    if (
      pathLower.includes("/coding") ||
      pathLower.includes("/compiler") ||
      pathLower.includes("/submissions") ||
      pathLower.includes("/patterns")
    ) {
      return next();
    }

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

  private sanitize(obj: unknown, keyName = ""): unknown {
    if (typeof obj !== "object" || obj === null) {
      if (typeof obj === "string") {
        if (CODE_OR_RAW_KEYS.has(keyName.toLowerCase())) {
          return obj;
        }
        return this.cleanString(obj);
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item: unknown) => this.sanitize(item, keyName));
    }

    const rawObj = obj as Record<string, unknown>;
    const sanitizedObj: Record<string, unknown> = {};
    for (const key of Object.keys(rawObj)) {
      sanitizedObj[key] = this.sanitize(rawObj[key], key);
    }
    return sanitizedObj;
  }

  private cleanString(str: string): string {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .trim();
  }
}
