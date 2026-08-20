import { apiClient } from '@/services/api/client';
import { AuthUser } from '@/types/auth.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardTestItem {
  id: string;
  title: string;
  company: string;
  durationMinutes: number;
  sections: string[];
  status: string;
  attemptCount: number;
  maxAttempts: number;
  canReattempt: boolean;
  hasActiveAttempt: boolean;
  questionCount: number;
  difficulty?: string | null;
  description?: string | null;
}

export interface DashboardActiveTest {
  id: string;
  title: string;
  remainingMinutes: number;
  status: string;
  testId: string;
  testName: string;
  instanceId: string;
}

export interface DashboardCompletedAttempt {
  id: string;
  testId: string;
  assessmentName: string;
  score: number | null;
  completedDate: string;
  status: string;
  instanceId: string;
}

export interface CandidateDashboardData {
  availableTests: DashboardTestItem[];
  activeTests: DashboardActiveTest[];
  completedAttempts: DashboardCompletedAttempt[];
  completedTests?: any[];
  recommendedTests?: any[];
  recommendations: CandidateRecommendations | null;
  skillProgress: never[];
}

export interface CandidateRecommendations {
  overallScore: number;
  confidenceScore: number;
  recommendationSummary: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const dashboardService = {
  getDashboard: async (): Promise<CandidateDashboardData> => {
    try {
      const data = await apiClient.request<any>('/candidate/dashboard');

      // Merge upcomingTests (enrolled) + recommendedTests into available list
      const allAvailable = [...(data.upcomingTests || []), ...(data.recommendedTests || [])].filter(
        (v: any, i: number, a: any[]) => a.findIndex((t) => (t.id || t.configId) === (v.id || v.configId)) === i,
      );

      const availableTests: DashboardTestItem[] = allAvailable.map((t: any) => ({
        id: t.id || t.configId,
        title: t.name,
        company: t.company || 'Unknown',
        durationMinutes: t.durationMinutes ?? Math.floor((t.durationSeconds || 0) / 60),
        sections: t.sections || [],
        status: t.enrollmentStatus || 'AVAILABLE',
        attemptCount: data.attemptsByConfig?.[t.id || t.configId] ?? t.attemptCount ?? 0,
        maxAttempts: t.maxAttempts ?? 3,
        canReattempt: t.canReattempt ?? true,
        hasActiveAttempt: t.hasActiveAttempt ?? false,
        questionCount: t.totalQuestions ?? t.questionCount ?? 0,
        difficulty: t.difficulty || null,
        description: t.description || null,
      }));

      const activeTests: DashboardActiveTest[] = (data.activeAttempts || []).map((a: any) => ({
        id: a.instanceId,
        title: a.name,
        remainingMinutes: Math.floor((a.timeRemainingSeconds || 0) / 60),
        status: 'IN_PROGRESS',
        testId: a.configId,
        testName: a.name,
        instanceId: a.instanceId,
      }));

      const completedAttempts: DashboardCompletedAttempt[] = (data.completedTests || []).map(
        (t: any) => ({
          id: t.instanceId,
          testId: t.configId,
          assessmentName: t.name,
          score: t.score,
          completedDate: t.submittedAt || new Date().toISOString(),
          status: 'COMPLETED',
          instanceId: t.instanceId,
        }),
      );

      return {
        availableTests,
        activeTests,
        completedAttempts,
        recommendations: null,
        skillProgress: [],
      };
    } catch (error) {
      console.error('Failed to fetch dashboard', error);
      throw error;
    }
  },

  getDashboardMetrics: async () => {
    try {
      return await apiClient.request<any>('/candidate/dashboard/metrics');
    } catch (error) {
      console.error('Failed to fetch dashboard metrics', error);
      throw error;
    }
  },

  getRecommendations: async (): Promise<CandidateRecommendations | null> => {
    try {
      const performanceSummary = await apiClient.request<any>('/users/me/performance-summary');
      if (!performanceSummary) return null;

      return {
        overallScore: performanceSummary.averageScore || 0,
        confidenceScore: 0,
        recommendationSummary: `Based on your recent performance, your average score is ${performanceSummary.averageScore || 0}%.`,
      };
    } catch (error) {
      console.error('Failed to fetch recommendations', error);
      return null;
    }
  },

  getPublicTests: async (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, String(value));
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await apiClient.request<any>(`/candidate/tests${query}`);
    if (response && response.tests) {
      response.tests = response.tests.map((t: any) => ({
        id: t.id || t.configId,
        title: t.name || t.displayName,
        company: t.company || null,
        description: t.description || t.summary || null,
        durationMinutes: t.durationMinutes ?? (t.duration ? Math.floor(t.duration / 60) : t.totalDurationSeconds ? Math.floor(t.totalDurationSeconds / 60) : 0),
        questionCount: t.totalQuestions ?? t.questionCount ?? 0,
        sections: t.sections || [],
        difficulty: t.difficulty || 'Medium',
        maxAttempts: t.maxAttempts ?? 3,
        attemptCount: t.attemptCount ?? 0,
        canReattempt: t.canReattempt ?? true,
      }));
    }
    return response;
  },

  enroll: async (testId: string) => {
    return apiClient.request<any>('/candidate/enrollments', {
      method: 'POST',
      body: { testId },
    });
  },

  getEnrollments: async () => {
    return apiClient.request<any>('/candidate/enrollments');
  },

  getAttemptHistory: async (page = 1, limit = 10) => {
    return apiClient.request<any>(`/candidate/attempts?page=${page}&limit=${limit}`);
  },

  getProfile: async (): Promise<AuthUser> => {
    return apiClient.request<AuthUser>('/candidate/profile');
  },

  updateProfile: async (data: Partial<AuthUser>): Promise<AuthUser> => {
    return apiClient.request<AuthUser>('/candidate/profile', {
      method: 'PATCH',
      body: data,
    });
  },
};
