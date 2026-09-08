import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dashboardService } from './dashboard.service';
import { apiClient } from '@/services/api/client';

vi.mock('@/services/api/client', () => ({
  apiClient: {
    request: vi.fn(),
  },
}));

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should format dashboard data correctly', async () => {
      vi.mocked(apiClient.request).mockResolvedValue({
        upcomingTests: [
          { configId: 't1', name: 'Test 1', durationSeconds: 3600, enrollmentStatus: 'ENROLLED' },
        ],
        activeAttempts: [],
        completedTests: [],
      });

      const data = await dashboardService.getDashboard();

      expect(apiClient.request).toHaveBeenCalledWith('/candidate/dashboard');
      expect(data.availableTests).toHaveLength(1);
      expect(data.availableTests[0].title).toBe('Test 1');
      expect(data.availableTests[0].durationMinutes).toBe(60);
    });
  });

  describe('enroll', () => {
    it('should call enrollment API', async () => {
      vi.mocked(apiClient.request).mockResolvedValue({ success: true });

      await dashboardService.enroll('t1');

      expect(apiClient.request).toHaveBeenCalledWith('/candidate/enrollments', {
        method: 'POST',
        body: { testId: 't1' },
      });
    });
  });

  describe('getPublicTests', () => {
    it('should encode parameters correctly', async () => {
      vi.mocked(apiClient.request).mockResolvedValue({});

      await dashboardService.getPublicTests({ search: 'React', limit: 10 });

      expect(apiClient.request).toHaveBeenCalledWith('/candidate/tests?search=React&limit=10');
    });
  });

  describe('getDashboardMetrics', () => {
    it('should return metrics when API call succeeds', async () => {
      const mockMetrics = { bestScore: 90, averageAccuracy: 85, attemptCount: 2 };
      vi.mocked(apiClient.request).mockResolvedValue(mockMetrics);

      const result = await dashboardService.getDashboardMetrics();

      expect(apiClient.request).toHaveBeenCalledWith('/candidate/dashboard/metrics', {
        skipErrorToast: true,
      });
      expect(result).toEqual(mockMetrics);
    });

    it('should return null when API call fails without throwing', async () => {
      vi.mocked(apiClient.request).mockRejectedValue(new Error('Network error'));

      const result = await dashboardService.getDashboardMetrics();

      expect(result).toBeNull();
    });
  });
});

