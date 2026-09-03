import { z } from 'zod';

export type PlanTier = 'FREE' | 'PRO' | 'TEAMS' | string;
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED' | 'INCOMPLETE';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface PlanFeatures {
  monthlyRoundsLimit: number | null;
  roundFormats: string[];
  voiceInterviews?: boolean;
  timedConditions?: boolean;
  rubricScoring?: 'overall_band' | 'per_criterion' | string;
  markedTranscript?: boolean;
  roundHistoryLimit: number | null;
  transcriptExport?: string[];
  questionBankSize?: number;
  roleTracksLimit?: number;
  customQuestionPacks?: boolean;
  seats?: number;
  cohortDashboard?: boolean;
  detailedAnalytics?: boolean;
  supportTier?: 'community' | 'email_1bd' | 'named_contact' | string;
  [key: string]: any;
}

export interface UserEntitlements {
  plan: PlanTier;
  planName?: string;
  planSlug?: string;
  status: SubscriptionStatus;
  hasActivePlan: boolean;
  currentPeriodEnd?: string | null;
  features: PlanFeatures & {
    monthlyRoundsUsed: number;
    monthlyRoundsRemaining: number | null;
  };
}

export const PLAN_ENTITLEMENT_DEFINITIONS: Record<string, PlanFeatures> = {
  FREE: {
    monthlyRoundsLimit: 3,
    roundFormats: ['behavioral', 'technical'],
    voiceInterviews: false,
    timedConditions: true,
    rubricScoring: 'overall_band',
    markedTranscript: false,
    roundHistoryLimit: 3,
    transcriptExport: [],
    questionBankSize: 50,
    roleTracksLimit: 1,
    customQuestionPacks: false,
    seats: 1,
    cohortDashboard: false,
    detailedAnalytics: false,
    supportTier: 'community',
  },
  PRO: {
    monthlyRoundsLimit: 20,
    roundFormats: ['behavioral', 'technical', 'case_study'],
    voiceInterviews: true,
    timedConditions: true,
    rubricScoring: 'per_criterion',
    markedTranscript: true,
    roundHistoryLimit: null,
    transcriptExport: ['markdown', 'pdf'],
    questionBankSize: 500,
    roleTracksLimit: 5,
    customQuestionPacks: true,
    seats: 1,
    cohortDashboard: false,
    detailedAnalytics: true,
    supportTier: 'email_1bd',
  },
  TEAMS: {
    monthlyRoundsLimit: null,
    roundFormats: ['all'],
    voiceInterviews: true,
    timedConditions: true,
    rubricScoring: 'per_criterion',
    markedTranscript: true,
    roundHistoryLimit: null,
    transcriptExport: ['markdown', 'pdf', 'csv', 'json'],
    questionBankSize: 2000,
    roleTracksLimit: 20,
    customQuestionPacks: true,
    seats: 10,
    cohortDashboard: true,
    detailedAnalytics: true,
    supportTier: 'named_contact',
  },
};

export const SubscriptionStatusResponseSchema = z.object({
  hasActivePlan: z.boolean(),
  plan: z.string().nullable(),
  planName: z.string().optional(),
  planSlug: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'INCOMPLETE']).nullable(),
  currentPeriodEnd: z.string().nullable().optional(),
  cancelAtPeriodEnd: z.boolean().default(false),
});

export type SubscriptionStatusResponse = z.infer<typeof SubscriptionStatusResponseSchema>;

export const CreateCheckoutDtoSchema = z.object({
  plan: z.string(),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
});

export type CreateCheckoutDto = z.infer<typeof CreateCheckoutDtoSchema>;

export const CheckoutSessionResponseSchema = z.object({
  orderId: z.string().optional(),
  subscriptionId: z.string().optional(),
  keyId: z.string(),
  amount: z.number(),
  currency: z.string(),
  plan: z.string(),
  user: z.object({
    name: z.string().optional(),
    email: z.string(),
    phone: z.string().optional(),
  }),
});

export type CheckoutSessionResponse = z.infer<typeof CheckoutSessionResponseSchema>;

export const CreateOrderDtoSchema = z.object({
  amount: z.number().min(100).optional(),
  currency: z.string().default('INR'),
  plan: z.string().default('PRO'),
  receipt: z.string().optional(),
});

export type CreateOrderDto = z.infer<typeof CreateOrderDtoSchema>;

export const CreateOrderResponseSchema = z.object({
  order_id: z.string(),
  orderId: z.string(),
  amount: z.number(),
  currency: z.string(),
  keyId: z.string(),
  plan: z.string(),
});

export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;

export const VerifyPaymentDtoSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  plan: z.string().optional(),
});

export type VerifyPaymentDto = z.infer<typeof VerifyPaymentDtoSchema>;

export const VerifyPaymentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  subscription: z.any().optional(),
  entitlements: z.any().optional(),
});

export type VerifyPaymentResponse = z.infer<typeof VerifyPaymentResponseSchema>;

// ==========================================
// DYNAMIC PLAN & PAYMENT MANAGER SCHEMAS
// ==========================================

export const PlanFeatureDtoSchema = z.object({
  id: z.string().optional(),
  planId: z.string().optional(),
  featureKey: z.string().min(1),
  featureName: z.string().min(1),
  valueType: z.enum(['BOOLEAN', 'NUMBER', 'ARRAY', 'STRING']),
  valueJson: z.any(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
});

export type PlanFeatureDto = z.infer<typeof PlanFeatureDtoSchema>;

export const PlanDtoSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  priceMonthly: z.number(), // in paise
  priceYearly: z.number().nullable().optional(),
  originalPrice: z.number().nullable().optional(), // in paise (e.g. 499900 = ₹4,999)
  currency: z.string().default('INR'),
  badge: z.string().nullable().optional(),
  isHighlighted: z.boolean().default(false),
  buttonText: z.string().default('Get Started'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  features: z.array(PlanFeatureDtoSchema).default([]),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type PlanDto = z.infer<typeof PlanDtoSchema>;

export const CreatePlanSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2),
  description: z.string().optional(),
  priceMonthly: z.number().min(0), // in paise
  priceYearly: z.number().optional(),
  originalPrice: z.number().optional(), // in paise
  currency: z.string().default('INR'),
  badge: z.string().optional(),
  isHighlighted: z.boolean().default(false),
  buttonText: z.string().default('Get Started'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  features: z.array(PlanFeatureDtoSchema).optional(),
});

export type CreatePlanDto = z.infer<typeof CreatePlanSchema>;

export const UpdatePlanSchema = CreatePlanSchema.partial();
export type UpdatePlanDto = z.infer<typeof UpdatePlanSchema>;

export const CreatePlanFeatureSchema = z.object({
  featureKey: z.string().min(1),
  featureName: z.string().min(1),
  valueType: z.enum(['BOOLEAN', 'NUMBER', 'ARRAY', 'STRING']),
  valueJson: z.any(),
  description: z.string().optional(),
  sortOrder: z.number().default(0),
});

export type CreatePlanFeatureDto = z.infer<typeof CreatePlanFeatureSchema>;

export const UpdatePlanFeatureSchema = CreatePlanFeatureSchema.partial();
export type UpdatePlanFeatureDto = z.infer<typeof UpdatePlanFeatureSchema>;

export const UserQuotaOverrideSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  featureKey: z.string(),
  overrideValue: z.any(),
  reason: z.string().optional(),
  expiresAt: z.string().or(z.date()).nullable().optional(),
});

export type UserQuotaOverrideDto = z.infer<typeof UserQuotaOverrideSchema>;

export const PaymentTransactionSummarySchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string().optional(),
  userName: z.string().optional(),
  razorpayPaymentId: z.string(),
  razorpayOrderId: z.string().nullable().optional(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
  plan: z.string().optional(),
  source: z.string().optional(),
  createdAt: z.date().or(z.string()),
});

export type PaymentTransactionSummary = z.infer<typeof PaymentTransactionSummarySchema>;

export const PaymentStatsResponseSchema = z.object({
  totalVolumePaise: z.number(),
  successfulCount: z.number(),
  pendingCount: z.number(),
  failedCount: z.number(),
  mrrEstimatePaise: z.number(),
});

export type PaymentStatsResponse = z.infer<typeof PaymentStatsResponseSchema>;

export const CandidateSubscriptionAdminSchema = z.object({
  userId: z.string(),
  email: z.string(),
  fullName: z.string().nullable().optional(),
  plan: z.string(),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'INCOMPLETE']),
  currentPeriodStart: z.date().or(z.string()),
  currentPeriodEnd: z.date().or(z.string()).nullable().optional(),
  roundsUsed: z.number().default(0),
  roundsLimit: z.number().nullable().optional(),
  overrides: z.array(UserQuotaOverrideSchema).default([]),
});

export type CandidateSubscriptionAdmin = z.infer<typeof CandidateSubscriptionAdminSchema>;
