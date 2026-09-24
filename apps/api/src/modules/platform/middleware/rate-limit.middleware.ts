import { Injectable, Logger } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerRequest } from "@nestjs/throttler";

export const RATE_LIMIT_CATEGORY_KEY = "rate_limit_category";

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  private readonly logger = new Logger(RateLimitGuard.name);

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context, throttler, limit, ttl } = requestProps;
    const request = context.switchToHttp().getRequest();

    // 1. Exclude internal service-to-service calls
    const internalToken = request.headers["x-internal-service-token"];
    const expectedToken =
      process.env.INTERNAL_SERVICE_TOKEN || "internal_secret_token";
    if (internalToken === expectedToken) {
      this.logger.debug(
        "Bypassing rate limit for verified internal service call.",
      );
      return true;
    }

    // 2. Category matching logic from CustomThrottlerGuard (backward compatibility)
    const category = this.reflector.getAllAndOverride<string>(
      RATE_LIMIT_CATEGORY_KEY,
      [context.getHandler(), context.getClass()],
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
      customLimit = Math.max(limit, 300); // Admin API: at least 300 requests/min
      customTtl = 60;
    } else if (path.includes("/api/v1/generation")) {
      customLimit = 20; // AI Generation: 20 requests/min
      customTtl = 60;
    } else if (role === "CANDIDATE") {
      customLimit = Math.max(limit, 300); // Candidate API: at least 300 requests/min
      customTtl = 60;
    }

    requestProps.limit = customLimit;
    requestProps.ttl = customTtl;

    return super.handleRequest(requestProps);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // 1. If candidate/user is authenticated, track per unique User ID
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }

    // 2. If test attempt ID is in the route parameter, throttle per attempt
    if (req.params?.id) {
      return `attempt:${req.params.id}`;
    }

    // 3. For auth endpoints (signup/login), track by IP + email to avoid campus Wi-Fi/NAT/runner collision
    const email = req.body?.email || req.query?.email;
    const forwarded = req.headers?.["x-forwarded-for"];
    let ip = req.ip || req.socket?.remoteAddress || "anonymous";
    if (forwarded) {
      const parsedIp = (typeof forwarded === "string" ? forwarded : forwarded[0])
        .split(",")[0]
        .trim();
      if (parsedIp) ip = parsedIp;
    }

    if (email && typeof email === "string") {
      return `auth:${ip}:${email.toLowerCase().trim()}`;
    }

    return `ip:${ip}`;
  }
}
