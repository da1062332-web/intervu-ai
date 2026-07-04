import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ResultDetailsPage } from '../pages/ResultDetailsPage';
import { useResultDetails } from '../hooks/results.hooks';

vi.mock('../hooks/results.hooks', () => ({
  useResultDetails: vi.fn(),
  useResultStatus: vi.fn().mockReturnValue({ isLoading: false, data: { status: 'COMPLETED' } })
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ attemptId: 'test-123' }),
  useRouter: () => ({ push: vi.fn() }),
}));

describe('ResultDetailsPage', () => {
  it('renders result details', () => {
    vi.mocked(useResultDetails).mockReturnValue({
      isLoading: false,
      data: {
        assessmentName: 'Frontend Test',
        score: 85,
        percentage: 85,
        accuracy: 90,
        completion: 100,
        rank: 1,
        submittedAt: new Date().toISOString(),
      },
    } as any);

    render(<ResultDetailsPage />);
    expect(screen.getByText('Frontend Test')).toBeInTheDocument();
    expect(screen.getByText('Export PDF')).toBeInTheDocument();
    expect(screen.getByText('Export JSON')).toBeInTheDocument();
  });
});
