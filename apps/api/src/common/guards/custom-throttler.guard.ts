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
}
