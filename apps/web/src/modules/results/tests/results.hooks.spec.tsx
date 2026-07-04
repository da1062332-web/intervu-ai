import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useResultDetails } from '../hooks/results.hooks';
import { resultApi } from '../api/results.api';
import React from 'react';

vi.mock('../api/results.api', () => ({
  resultApi: {
    getResultDetails: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('results.hooks', () => {
  it('useResultDetails fetches data', async () => {
    const mockData = { attemptId: 'test-123' };
    vi.mocked(resultApi.getResultDetails).mockResolvedValue(mockData as any);

    const { result } = renderHook(() => useResultDetails('test-123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });
});
