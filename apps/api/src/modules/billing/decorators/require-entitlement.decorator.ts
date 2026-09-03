import { SetMetadata } from "@nestjs/common";
import { PlanFeatures } from "@intervu-ai/contracts";

export const REQUIRE_ENTITLEMENT_KEY = "REQUIRE_ENTITLEMENT";

export interface EntitlementRequirement {
  feature: keyof PlanFeatures;
  requiredValue?: any;
}

export const RequireEntitlement = (
  feature: keyof PlanFeatures,
  requiredValue?: any,
) => SetMetadata(REQUIRE_ENTITLEMENT_KEY, { feature, requiredValue });
