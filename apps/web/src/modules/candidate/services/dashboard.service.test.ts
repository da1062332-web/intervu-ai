import { dashboardService } from './dashboard.service';
import { apiClient } from '@/services/api/client';

jest.mock('@/services/api/client', () => ({
  apiClient: {
    request: jest.fn(),
  },
}));

describe('DashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should format dashboard data correctly', async () => {
      (apiClient.request as jest.Mock).mockResolvedValue({
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
      (apiClient.request as jest.Mock).mockResolvedValue({ success: true });

      await dashboardService.enroll('t1');

      expect(apiClient.request).toHaveBeenCalledWith('/candidate/enrollments', {
        method: 'POST',
        body: { testId: 't1' },
      });
    });
  });

  describe('getPublicTests', () => {
    it('should encode parameters correctly', async () => {
      (apiClient.request as jest.Mock).mockResolvedValue({});

      await dashboardService.getPublicTests({ search: 'React', limit: 10 });

      expect(apiClient.request).toHaveBeenCalledWith('/tests/public?search=React&limit=10');
    });
  });
});
