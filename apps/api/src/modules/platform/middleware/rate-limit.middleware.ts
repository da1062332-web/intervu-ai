import { Injectable, Logger } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerRequest } from "@nestjs/throttler";

export const RATE_LIMIT_CATEGORY_KEY = "rate_limit_category";

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  private readonly logger = new Logger(RateLimitGuard.name);

  protected async handleRequest(
    requestProps: ThrottlerRequest
  ): Promise<boolean> {
    const { context, throttler, limit, ttl } = requestProps;
    const request = context.switchToHttp().getRequest();

    // 1. Exclude internal service-to-service calls
    const internalToken = request.headers["x-internal-service-token"];
    const expectedToken = process.env.INTERNAL_SERVICE_TOKEN || "internal_secret_token";
    if (internalToken === expectedToken) {
      this.logger.debug("Bypassing rate limit for verified internal service call.");
      return true;
    }

    // 2. Category matching logic from CustomThrottlerGuard (backward compatibility)
    const category = this.reflector.getAllAndOverride<string>(
      RATE_LIMIT_CATEGORY_KEY,
      [context.getHandler(), context.getClass()]
    );
    const resolvedCategory = category || "default";

    if (throttler.name !== resolvedCategory) {
      return true; // Skip this throttler category mismatch
    }

    // 3. Role + Endpoint specific rate limiting overrides
    const user = request.user;
    const role = user?.role; // "CANDIDATE" or "ADMIN"
    const path = request.path || "";

    let customLimit = limit;
    let customTtl = ttl;

    if (role === "ADMIN") {
      customLimit = 300; // Admin API: 300 requests/min
      customTtl = 60;
    } else if (path.includes("/api/v1/generation")) {
      customLimit = 20;  // AI Generation: 20 requests/min
      customTtl = 60;
    } else if (role === "CANDIDATE") {
      customLimit = 100; // Candidate API: 100 requests/min
      customTtl = 60;
    }

    requestProps.limit = customLimit;
    requestProps.ttl = customTtl;

    return super.handleRequest(requestProps);
  }
}
