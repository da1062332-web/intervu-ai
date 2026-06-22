import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CandidateDashboard } from '../pages/CandidateDashboard';
import { useCandidateDashboard } from '../hooks/useCandidateDashboard';

// Mock navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock hook
vi.mock('../hooks/useCandidateDashboard', () => ({
  useCandidateDashboard: vi.fn(),
}));

describe('CandidateDashboard component', () => {
  it('renders loading skeleton', () => {
    (useCandidateDashboard as any).mockReturnValue({
      isLoading: true,
      data: null,
      error: null,
      refetch: vi.fn(),
    });

    render(<CandidateDashboard />);
    // Check if loaders/skeletons are displayed
    expect(
      screen.getByTestId('dashboard-skeleton') ||
        screen.queryByRole('heading', { name: /Welcome/i }),
    ).toBeDefined();
  });

  it('renders error state with retry option', () => {
    const mockRefetch = vi.fn();
    (useCandidateDashboard as any).mockReturnValue({
      isLoading: false,
      data: null,
      error: 'Network connectivity lost',
      refetch: mockRefetch,
    });

    render(<CandidateDashboard />);
    expect(screen.getByText(/Network connectivity lost/i)).toBeInTheDocument();
    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    expect(retryBtn).toBeInTheDocument();
  });

  it('renders widgets and assessments correctly', () => {
    (useCandidateDashboard as any).mockReturnValue({
      isLoading: false,
      data: {
        availableTests: [
          {
            id: 'tcs-nqt-001',
            title: 'TCS NQT Cognitive Assessment',
            durationMinutes: 90,
            sections: ['Numerical', 'Verbal'],
            status: 'AVAILABLE',
          },
        ],
        activeTests: [],
        completedAttempts: [
          {
            id: 'attempt-1',
            assessmentName: 'React Basics',
            score: 88,
            completedDate: '2026-06-10T10:00:00Z',
            status: 'Completed',
          },
        ],
        recommendations: {
          overallScore: 88,
          confidenceScore: 92,
          recommendationSummary: 'Review React lifecycle methods.',
        },
        skillProgress: [{ skill: 'React', score: 88 }],
      },
      error: null,
      refetch: vi.fn(),
    });

    render(<CandidateDashboard />);
    expect(screen.getByText('TCS NQT Cognitive Assessment')).toBeInTheDocument();
    expect(screen.getByText('React Basics')).toBeInTheDocument();
    expect(screen.getByText('AI Recommendations')).toBeInTheDocument();
  });
});
