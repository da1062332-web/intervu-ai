import { z } from 'zod';

// ──────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────
export const ReferralCampaignTypeSchema = z.enum(['COMPANY', 'CANDIDATE']);
export type ReferralCampaignType = z.infer<typeof ReferralCampaignTypeSchema>;

export const ReferralCampaignStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'EXPIRED']);
export type ReferralCampaignStatus = z.infer<typeof ReferralCampaignStatusSchema>;

export const ReferralEventStatusSchema = z.enum(['PENDING', 'QUALIFIED', 'REWARDED', 'FAILED']);
export type ReferralEventStatus = z.infer<typeof ReferralEventStatusSchema>;

// ──────────────────────────────────────────────
// Reward Config Schema (dynamic JSON)
// rewardConfig tells the RewardResolver what UserQuotaOverride to create
// ──────────────────────────────────────────────
export const RewardConfigSchema = z.object({
  featureKey: z.string(),          // e.g. 'monthly_rounds_limit' or 'allowed_assessments'
  overrideValue: z.any(),          // e.g. { bonusRounds: 1 } or { bonusRounds: 2 } or specific test IDs
  expiresInDays: z.number().optional().nullable(),  // null = never expires
  reason: z.string().optional(),
});
export type RewardConfig = z.infer<typeof RewardConfigSchema>;

// ──────────────────────────────────────────────
// Eligibility Config Schema (dynamic JSON)
// ──────────────────────────────────────────────
export const EligibilityConfigSchema = z.object({
  requiresSubscription: z.boolean().optional().default(false),
  maxRedemptionsPerUser: z.number().optional().default(1),
  allowSelfReferral: z.boolean().optional().default(false),
  minimumSignupAgeHours: z.number().optional().nullable(),
});
export type EligibilityConfig = z.infer<typeof EligibilityConfigSchema>;

// ──────────────────────────────────────────────
// Campaign DTOs
// ──────────────────────────────────────────────
export const CreateReferralCampaignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: ReferralCampaignTypeSchema,
  referrerRewardConfig: RewardConfigSchema.optional(),
  refereeRewardConfig: RewardConfigSchema,
  eligibilityConfig: EligibilityConfigSchema.optional(),
  totalRedemptionLimit: z.number().positive().optional().nullable(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional().nullable(),
});
export type CreateReferralCampaignDto = z.infer<typeof CreateReferralCampaignSchema>;

export const UpdateReferralCampaignSchema = CreateReferralCampaignSchema.partial().extend({
  status: ReferralCampaignStatusSchema.optional(),
});
export type UpdateReferralCampaignDto = z.infer<typeof UpdateReferralCampaignSchema>;

export interface ReferralCampaignDto {
  id: string;
  name: string;
  description?: string | null;
  type: ReferralCampaignType;
  status: ReferralCampaignStatus;
  referrerRewardConfig: RewardConfig | Record<string, any>;
  refereeRewardConfig: RewardConfig | Record<string, any>;
  eligibilityConfig: EligibilityConfig | Record<string, any>;
  totalRedemptionLimit: number | null;
  totalRedemptionCount: number;
  startsAt: string;
  endsAt: string | null;
  codes?: ReferralCodeDto[];
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// Code DTOs
// ──────────────────────────────────────────────
export const CreateReferralCodeSchema = z.object({
  campaignId: z.string(),
  maxUses: z.number().positive().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});
export type CreateReferralCodeDto = z.infer<typeof CreateReferralCodeSchema>;

export interface ReferralCodeDto {
  id: string;
  campaignId: string;
  userId: string | null;
  code: string;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Redemption DTOs
// ──────────────────────────────────────────────
export const RedeemCodeSchema = z.object({
  code: z.string().min(1).max(50),
});
export type RedeemCodeDto = z.infer<typeof RedeemCodeSchema>;

export interface RedemptionResultDto {
  success: boolean;
  message: string;
  reward?: RewardConfig;
  redemptionId?: string;
  alreadyRedeemed?: boolean;
}

// ──────────────────────────────────────────────
// Event DTOs
// ──────────────────────────────────────────────
export interface ReferralEventDto {
  id: string;
  campaignId: string;
  referrerId: string;
  referredId: string;
  status: ReferralEventStatus;
  referrerRewardSnapshot?: RewardConfig | null;
  refereeRewardSnapshot?: RewardConfig | null;
  qualifiedAt: string | null;
  rewardedAt: string | null;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Candidate Referral Dashboard
// ──────────────────────────────────────────────
export interface CandidateReferralStatusDto {
  personalCode: string | null;     // unique referral code
  referralLink: string | null;     // full shareable URL
  totalReferrals: number;
  pendingReferrals: number;
  rewardedReferrals: number;
  redemptions: RedemptionResultDto[];
  events: ReferralEventDto[];
}
