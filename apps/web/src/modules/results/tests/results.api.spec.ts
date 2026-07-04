import { describe, it, expect, vi } from 'vitest';
import { resultApi } from '../api/results.api';
import { apiClient } from '@/services/api/client';

vi.mock('@/services/api/client', () => ({
  apiClient: {
    request: vi.fn(),
  },
}));

describe('results.api', () => {
  it('getDashboardWidgets makes correct request', async () => {
    const mockData = { attemptCount: 5 };
    vi.mocked(apiClient.request).mockResolvedValue(mockData);

    const data = await resultApi.getDashboardWidgets();

    expect(apiClient.request).toHaveBeenCalledWith('/results/dashboard');
    expect(data).toEqual(mockData);
  });
});
