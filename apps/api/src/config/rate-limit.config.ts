import {
  ThrottlerAsyncOptions,
  ThrottlerModuleOptions,
} from "@nestjs/throttler";
import { AppConfigService } from "./config.service";
import { ConfigModule } from "./config.module";

export const rateLimitConfig: ThrottlerAsyncOptions = {
  imports: [ConfigModule],
  inject: [AppConfigService],
  useFactory: (config: AppConfigService): ThrottlerModuleOptions => {
    const limits = config.rateLimits;
    return {
      throttlers: [
        {
          name: "default",
          ttl: limits.default.ttl,
          limit: limits.default.limit,
        },
        {
          name: "auth",
          ttl: limits.auth.ttl,
          limit: limits.auth.limit,
        },
        {
          name: "assessment",
          ttl: limits.assessment.ttl,
          limit: limits.assessment.limit,
        },
        {
          name: "submission",
          ttl: limits.submission.ttl,
          limit: limits.submission.limit,
        },
      ],
    };
  },
};
