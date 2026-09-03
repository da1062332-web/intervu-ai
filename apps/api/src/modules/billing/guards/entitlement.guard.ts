import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  REQUIRE_ENTITLEMENT_KEY,
  EntitlementRequirement,
} from "../decorators/require-entitlement.decorator";
import { EntitlementService } from "../services/entitlement.service";

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementService: EntitlementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.getAllAndOverride<
      EntitlementRequirement | undefined
    >(REQUIRE_ENTITLEMENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException("User authentication required for feature check");
    }

    const hasAccess = await this.entitlementService.hasEntitlement(
      user.id,
      String(requirement.feature),
      requirement.requiredValue,
    );

    if (!hasAccess) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "Forbidden",
        code: "FEATURE_NOT_ENTITLED",
        message: `Feature '${String(requirement.feature)}' is not available on your current plan. Please upgrade your subscription.`,
        feature: requirement.feature,
      });
    }

    return true;
  }
}
