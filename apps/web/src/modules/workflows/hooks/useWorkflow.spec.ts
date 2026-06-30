import { renderHook, act } from '@testing-library/react';
import { useWorkflows } from './useWorkflow';
import { apiClient } from '@/services/api/client';

jest.mock('@/services/api/client');

describe('useWorkflows', () => {
  it('should fetch workflows successfully', async () => {
    const mockData = { items: [], total: 0 };
    (apiClient.request as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useWorkflows());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await result.current.fetchWorkflows();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.workflows).toEqual([]);
  });
});
