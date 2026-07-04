import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ResultHistoryPage } from '../pages/ResultHistoryPage';
import { useCandidateResults } from '../hooks/results.hooks';
import { useAuth } from '@/hooks/use-auth';

vi.mock('../hooks/results.hooks', () => ({
  useCandidateResults: vi.fn(),
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('ResultHistoryPage', () => {
  it('renders history results and controls', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-1' } } as any);
    vi.mocked(useCandidateResults).mockReturnValue({
      isLoading: false,
      data: {
        data: [
          {
            id: 'res-1',
            attemptId: 'att-1',
            assessmentName: 'React Test',
            score: 95,
            percentage: 95,
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
          }
        ],
        meta: { totalPages: 1 }
      },
    } as any);

    render(<ResultHistoryPage />);
    expect(screen.getByText('React Test')).toBeInTheDocument();
    expect(screen.getByText('Score: 95')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });
});
