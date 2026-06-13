import { SetMetadata } from "@nestjs/common";
import { RATE_LIMIT_CATEGORY_KEY } from "../guards/custom-throttler.guard";

export type RateLimitCategoryType =
  | "auth"
  | "assessment"
  | "submission"
  | "default";

export const RateLimitCategory = (category: RateLimitCategoryType) =>
  SetMetadata(RATE_LIMIT_CATEGORY_KEY, category);
