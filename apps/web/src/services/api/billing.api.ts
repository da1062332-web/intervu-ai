import { apiClient } from '@/services/api/client';
import type {
  SubscriptionStatusResponse,
  UserEntitlements,
  CreateCheckoutDto,
  CheckoutSessionResponse,
  CreateOrderDto,
  CreateOrderResponse,
  VerifyPaymentDto,
  VerifyPaymentResponse,
  PlanDto,
  CreatePlanDto,
  UpdatePlanDto,
  CreatePlanFeatureDto,
  UpdatePlanFeatureDto,
  PaymentStatsResponse,
} from '@intervu-ai/contracts';

const BILLING_BASE_PATH = '/billing';
const ADMIN_PLANS_PATH = '/admin/plans';
const ADMIN_PAYMENTS_PATH = '/admin/payments';
const ADMIN_SUBS_PATH = '/admin/subscriptions';

let cachedPlans: { data: PlanDto[]; expiresAt: number } | null = null;
let inFlightPlansPromise: Promise<PlanDto[]> | null = null;

export const billingApi = {
  // ==========================================
  // CANDIDATE / PUBLIC ENDPOINTS
  // ==========================================

  async getPublicPlans(): Promise<PlanDto[]> {
    if (cachedPlans && Date.now() < cachedPlans.expiresAt) {
      return cachedPlans.data;
    }
    if (inFlightPlansPromise) {
      return inFlightPlansPromise;
    }
    inFlightPlansPromise = apiClient
      .request<PlanDto[]>(`${BILLING_BASE_PATH}/plans`, {
        method: 'GET',
        skipErrorToast: true,
      })
      .then((data) => {
        cachedPlans = { data, expiresAt: Date.now() + 5 * 60 * 1000 };
        inFlightPlansPromise = null;
        return data;
      })
      .catch((err) => {
        inFlightPlansPromise = null;
        throw err;
      });
    return inFlightPlansPromise;
  },

  async getStatus(): Promise<SubscriptionStatusResponse> {
    return apiClient.request<SubscriptionStatusResponse>(`${BILLING_BASE_PATH}/me`, {
      method: 'GET',
      skipErrorToast: true,
    });
  },

  async getEntitlements(): Promise<UserEntitlements> {
    return apiClient.request<UserEntitlements>(`${BILLING_BASE_PATH}/me/entitlements`, {
      method: 'GET',
      skipErrorToast: true,
    });
  },

  async subscribeFree(): Promise<{ success: boolean; subscription: any; entitlements: UserEntitlements }> {
    return apiClient.request<{ success: boolean; subscription: any; entitlements: UserEntitlements }>(
      `${BILLING_BASE_PATH}/subscribe-free`,
      {
        method: 'POST',
      },
    );
  },

  async createOrder(payload: CreateOrderDto): Promise<CreateOrderResponse> {
    return apiClient.request<CreateOrderResponse>(`${BILLING_BASE_PATH}/create-order`, {
      method: 'POST',
      body: payload,
    });
  },

  async verifyPayment(payload: VerifyPaymentDto): Promise<VerifyPaymentResponse> {
    return apiClient.request<VerifyPaymentResponse>(`${BILLING_BASE_PATH}/verify-payment`, {
      method: 'POST',
      body: payload,
    });
  },

  async createCheckout(payload: CreateCheckoutDto): Promise<CheckoutSessionResponse> {
    return apiClient.request<CheckoutSessionResponse>(`${BILLING_BASE_PATH}/create-checkout`, {
      method: 'POST',
      body: payload,
    });
  },

  // ==========================================
  // PLAN MANAGER: PLANS & LIMITATIONS CRUD
  // ==========================================

  async adminGetAllPlans(includeInactive = true): Promise<PlanDto[]> {
    return apiClient.request<PlanDto[]>(
      `${ADMIN_PLANS_PATH}?includeInactive=${includeInactive}`,
      { method: 'GET' },
    );
  },

  async adminGetAvailableAssessments(): Promise<
    Array<{ id: string; name: string; role?: string; code?: string; durationMinutes?: number; totalQuestions?: number }>
  > {
    return apiClient.request<any[]>(`${ADMIN_PLANS_PATH}/available-assessments`, {
      method: 'GET',
    });
  },

  async adminCreatePlan(payload: CreatePlanDto): Promise<PlanDto> {
    return apiClient.request<PlanDto>(ADMIN_PLANS_PATH, {
      method: 'POST',
      body: payload,
    });
  },

  async adminUpdatePlan(id: string, payload: UpdatePlanDto): Promise<PlanDto> {
    return apiClient.request<PlanDto>(`${ADMIN_PLANS_PATH}/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  async adminDeletePlan(id: string): Promise<{ success: boolean }> {
    return apiClient.request<{ success: boolean }>(`${ADMIN_PLANS_PATH}/${id}`, {
      method: 'DELETE',
    });
  },

  async adminAddFeature(planId: string, payload: CreatePlanFeatureDto): Promise<any> {
    return apiClient.request<any>(`${ADMIN_PLANS_PATH}/${planId}/features`, {
      method: 'POST',
      body: payload,
    });
  },

  async adminUpdateFeature(planId: string, featureId: string, payload: UpdatePlanFeatureDto): Promise<any> {
    return apiClient.request<any>(`${ADMIN_PLANS_PATH}/${planId}/features/${featureId}`, {
      method: 'PUT',
      body: payload,
    });
  },

  async adminDeleteFeature(planId: string, featureId: string): Promise<any> {
    return apiClient.request<any>(`${ADMIN_PLANS_PATH}/${planId}/features/${featureId}`, {
      method: 'DELETE',
    });
  },

  // ==========================================
  // PLAN MANAGER: PAYMENTS & REVENUE
  // ==========================================

  async adminGetTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ data: any[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    return apiClient.request<{ data: any[]; pagination: any }>(
      `${ADMIN_PAYMENTS_PATH}/transactions?${query.toString()}`,
      { method: 'GET' },
    );
  },

  async adminGetPaymentStats(): Promise<PaymentStatsResponse> {
    return apiClient.request<PaymentStatsResponse>(`${ADMIN_PAYMENTS_PATH}/stats`, {
      method: 'GET',
    });
  },

  async adminManualVerifyPayment(transactionId: string): Promise<any> {
    return apiClient.request<any>(`${ADMIN_PAYMENTS_PATH}/manual-verify`, {
      method: 'POST',
      body: { transactionId },
    });
  },

  async adminGetWebhookLogs(page = 1, limit = 25): Promise<{ data: any[]; pagination: any }> {
    return apiClient.request<{ data: any[]; pagination: any }>(
      `${ADMIN_PAYMENTS_PATH}/webhooks?page=${page}&limit=${limit}`,
      { method: 'GET' },
    );
  },

  async adminSimulateWebhook(): Promise<any> {
    return apiClient.request<any>(`${ADMIN_PAYMENTS_PATH}/webhooks/simulate-test`, {
      method: 'POST',
    });
  },

  // ==========================================
  // PLAN MANAGER: CANDIDATE SUBSCRIPTIONS & OVERRIDES
  // ==========================================

  async adminGetCandidateSubscriptions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    plan?: string;
    status?: string;
  }): Promise<{ data: any[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    if (params?.plan) query.append('plan', params.plan);
    if (params?.status) query.append('status', params.status);

    return apiClient.request<{ data: any[]; pagination: any }>(
      `${ADMIN_SUBS_PATH}?${query.toString()}`,
      { method: 'GET' },
    );
  },

  async adminChangeCandidatePlan(userId: string, plan: string): Promise<any> {
    return apiClient.request<any>(`${ADMIN_SUBS_PATH}/${userId}/plan`, {
      method: 'PUT',
      body: { plan },
    });
  },

  async adminExtendSubscription(userId: string, days: number): Promise<any> {
    return apiClient.request<any>(`${ADMIN_SUBS_PATH}/${userId}/extend`, {
      method: 'PUT',
      body: { days },
    });
  },

  async adminCancelSubscription(userId: string): Promise<any> {
    return apiClient.request<any>(`${ADMIN_SUBS_PATH}/${userId}/cancel`, {
      method: 'POST',
    });
  },

  async adminGrantQuotaOverride(
    userId: string,
    payload: {
      featureKey: string;
      overrideValue: any;
      reason?: string;
      expiresAt?: string | null;
    },
  ): Promise<any> {
    return apiClient.request<any>(`${ADMIN_SUBS_PATH}/${userId}/quota-override`, {
      method: 'POST',
      body: payload,
    });
  },

  async adminDeleteQuotaOverride(overrideId: string): Promise<any> {
    return apiClient.request<any>(`${ADMIN_SUBS_PATH}/quota-override/${overrideId}`, {
      method: 'DELETE',
    });
  },
};
