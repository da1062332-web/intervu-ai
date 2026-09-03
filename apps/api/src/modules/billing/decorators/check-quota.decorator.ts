import { SetMetadata } from "@nestjs/common";

export const CHECK_QUOTA_KEY = "CHECK_QUOTA";

export const CheckQuota = (quotaType: "monthlyRounds" = "monthlyRounds") =>
  SetMetadata(CHECK_QUOTA_KEY, quotaType);
