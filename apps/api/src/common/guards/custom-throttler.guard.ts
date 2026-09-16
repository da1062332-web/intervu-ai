import { Injectable } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerRequest } from "@nestjs/throttler";

export const RATE_LIMIT_CATEGORY_KEY = "rate_limit_category";

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context, throttler } = requestProps;

    const category = this.reflector.getAllAndOverride<string>(
      RATE_LIMIT_CATEGORY_KEY,
      [context.getHandler(), context.getClass()],
    );

    const resolvedCategory = category || "default";

    if (throttler.name !== resolvedCategory) {
      return true; // Skip this throttler
    }

    return super.handleRequest(requestProps);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    if (req.params?.id) {
      return `attempt:${req.params.id}`;
    }
    const forwarded = req.headers?.["x-forwarded-for"];
    if (forwarded) {
      const ip = (typeof forwarded === "string" ? forwarded : forwarded[0])
        .split(",")[0]
        .trim();
      if (ip) return `ip:${ip}`;
    }
    return req.ip || req.socket?.remoteAddress || "anonymous";
  }
}
