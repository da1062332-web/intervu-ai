import { apiClient } from '@/services/api/client';

const ADMIN_REFERRALS_PATH = '/admin/referrals';
const CANDIDATE_REFERRALS_PATH = '/candidate/referrals';

let cachedReferralStatus: { data: any; expiresAt: number } | null = null;
let inFlightReferralStatus: Promise<any> | null = null;

export const referralsApi = {
  // ==========================================
  // ADMIN / PLAN MANAGER
  // ==========================================

  async adminGetCampaigns(page = 1, limit = 20) {
    return apiClient.request<any>(
      `${ADMIN_REFERRALS_PATH}/campaigns?page=${page}&limit=${limit}`,
      { method: 'GET' },
    );
  },

  async adminCreateCampaign(payload: {
    name: string;
    description?: string;
    type: 'COMPANY' | 'CANDIDATE';
    referrerRewardConfig?: any;
    refereeRewardConfig: any;
    eligibilityConfig?: any;
    totalRedemptionLimit?: number | null;
    startsAt?: string;
    endsAt?: string | null;
  }) {
    return apiClient.request<any>(ADMIN_REFERRALS_PATH + '/campaigns', {
      method: 'POST',
      body: payload,
    });
  },

  async adminUpdateCampaign(id: string, payload: any) {
    return apiClient.request<any>(`${ADMIN_REFERRALS_PATH}/campaigns/${id}`, {
      method: 'PUT',
      body: payload,
    });
  },

  async adminDeleteCampaign(id: string) {
    return apiClient.request<any>(`${ADMIN_REFERRALS_PATH}/campaigns/${id}`, {
      method: 'DELETE',
    });
  },

  async adminGetCampaign(id: string) {
    return apiClient.request<any>(`${ADMIN_REFERRALS_PATH}/campaigns/${id}`, {
      method: 'GET',
    });
  },

  async adminGenerateCode(
    campaignId: string,
    payload?: { maxUses?: number; expiresAt?: string; code?: string },
  ) {
    return apiClient.request<any>(
      `${ADMIN_REFERRALS_PATH}/campaigns/${campaignId}/codes`,
      { method: 'POST', body: payload || {} },
    );
  },

  async adminGetCodes(campaignId: string) {
    return apiClient.request<any>(
      `${ADMIN_REFERRALS_PATH}/campaigns/${campaignId}/codes`,
      { method: 'GET' },
    );
  },

  async adminDeactivateCode(codeId: string) {
    return apiClient.request<any>(`${ADMIN_REFERRALS_PATH}/codes/${codeId}`, {
      method: 'DELETE',
    });
  },

  async adminGetOverview() {
    return apiClient.request<any>(`${ADMIN_REFERRALS_PATH}/overview`, {
      method: 'GET',
      skipErrorToast: true,
    });
  },

  // ==========================================
  // CANDIDATE
  // ==========================================

  async getCandidateReferralStatus(forceRefresh = false) {
    if (!forceRefresh && cachedReferralStatus && Date.now() < cachedReferralStatus.expiresAt) {
      return cachedReferralStatus.data;
    }
    if (inFlightReferralStatus) {
      return inFlightReferralStatus;
    }
    inFlightReferralStatus = apiClient
      .request<any>(`${CANDIDATE_REFERRALS_PATH}/status`, {
        method: 'GET',
        skipErrorToast: true,
      })
      .then((data) => {
        cachedReferralStatus = { data, expiresAt: Date.now() + 60_000 };
        inFlightReferralStatus = null;
        return data;
      })
      .catch((err) => {
        inFlightReferralStatus = null;
        throw err;
      });
    return inFlightReferralStatus;
  },

  async redeemCode(code: string) {
    cachedReferralStatus = null;
    return apiClient.request<any>(`${CANDIDATE_REFERRALS_PATH}/redeem`, {
      method: 'POST',
      body: { code },
    });
  },
};

