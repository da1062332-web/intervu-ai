import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TestSummaryPage from '../../../../app/candidate/tests/[id]/summary/page';
import { useExecutionStore } from '../stores/execution.store';

vi.mock('../stores/execution.store', () => ({
  useExecutionStore: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({
    id: 'test-123',
  }),
}));

describe('TestSummaryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when test instance is missing', () => {
    (useExecutionStore as any).mockReturnValue({
      testInstance: null,
      questions: [],
      answers: {},
      remainingTime: 0,
    });

    render(<TestSummaryPage />);
    expect(screen.getByText('Loading Summary...')).toBeInTheDocument();
  });

  it('renders completion percentage and time spent', () => {
    (useExecutionStore as any).mockReturnValue({
      testInstance: {
        durationSeconds: 3600,
        sections: [
          {
            id: 'sec1',
            title: 'Logical',
            questions: [{ id: 'q1' }, { id: 'q2' }],
          },
        ],
      },
      questions: [{ id: 'q1' }, { id: 'q2' }],
      answers: {
        q1: { status: 'ANSWERED', selectedOptionId: 'opt1' },
      },
      remainingTime: 3000,
    });

    render(<TestSummaryPage />);

    // 1 answered out of 2 = 50%
    expect(screen.getByText('Overall Progress - 50% Completed')).toBeInTheDocument();

    // 3600 - 3000 = 600s = 10m 0s
    expect(screen.getByText('10m 0s')).toBeInTheDocument();

    // Section Breakdown
    expect(screen.getByText('Logical')).toBeInTheDocument();
    expect(screen.getByText('1 / 2 answered')).toBeInTheDocument();
  });
});
