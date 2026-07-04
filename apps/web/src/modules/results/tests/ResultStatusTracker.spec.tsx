import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ResultStatusTracker } from '../components/ResultStatusTracker';
import { useResultStatus } from '../hooks/results.hooks';

vi.mock('../hooks/results.hooks', () => ({
  useResultStatus: vi.fn(),
}));

describe('ResultStatusTracker', () => {
  it('renders loading state', () => {
    vi.mocked(useResultStatus).mockReturnValue({ isLoading: true } as any);
    render(<ResultStatusTracker attemptId='test-123' />);
    expect(screen.getByText('Checking status...')).toBeInTheDocument();
  });

  it('renders completed status', () => {
    vi.mocked(useResultStatus).mockReturnValue({
      isLoading: false,
      data: { status: 'COMPLETED' },
    } as any);

    render(<ResultStatusTracker attemptId='test-123' />);
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });
});
