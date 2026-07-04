import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StrengthWeaknessPanel } from '../components/StrengthWeaknessPanel';
import { useResultAnalysis } from '../hooks/results.hooks';

vi.mock('../hooks/results.hooks', () => ({
  useResultAnalysis: vi.fn(),
}));

describe('StrengthWeaknessPanel', () => {
  it('renders strengths and weaknesses', () => {
    vi.mocked(useResultAnalysis).mockReturnValue({
      isLoading: false,
      data: {
        strengths: [{ topic: 'React', score: 90, remarks: 'Good' }],
        weaknesses: [{ topic: 'CSS', score: 40, remarks: 'Needs work' }],
      },
    } as any);

    render(<StrengthWeaknessPanel attemptId='test-123' />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('CSS')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });
});
