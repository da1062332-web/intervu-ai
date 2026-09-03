import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CHECK_QUOTA_KEY } from "../decorators/check-quota.decorator";
import { EntitlementService } from "../services/entitlement.service";

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementService: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const quotaType = this.reflector.getAllAndOverride<string | undefined>(
      CHECK_QUOTA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!quotaType) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException("User authentication required for quota check");
    }

    const hasQuota = await this.entitlementService.hasRoundQuota(user.id);

    if (!hasQuota) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "Forbidden",
        code: "MONTHLY_QUOTA_EXCEEDED",
        message:
          "You have reached your monthly round limit. Please upgrade to Pro for unlimited assessments and rounds.",
      });
    }

    return true;
  }
}
