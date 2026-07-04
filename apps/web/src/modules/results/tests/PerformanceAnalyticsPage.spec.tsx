import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PerformanceAnalyticsPage } from '../pages/PerformanceAnalyticsPage';
import { useResultAnalytics, useResultDetails } from '../hooks/results.hooks';

vi.mock('../hooks/results.hooks', () => ({
  useResultAnalytics: vi.fn(),
  useResultDetails: vi.fn(),
  useResultAnalysis: vi
    .fn()
    .mockReturnValue({ isLoading: false, data: { strengths: [], weaknesses: [] } }),
  useResultRecommendations: vi.fn().mockReturnValue({
    isLoading: false,
    data: {
      practiceSuggestions: [],
      focusTopics: [],
      improvementPlan: [],
      estimatedPracticeHours: 5,
      priority: 'High',
    },
  }),
}));

vi.mock('next/navigation', () => ({
  useParams: () => ({ attemptId: 'test-123' }),
  useRouter: () => ({ push: vi.fn() }),
}));

describe('PerformanceAnalyticsPage', () => {
  it('renders analytics metrics', () => {
    vi.mocked(useResultDetails).mockReturnValue({
      isLoading: false,
      data: { assessmentName: 'Test' },
    } as any);
    vi.mocked(useResultAnalytics).mockReturnValue({
      isLoading: false,
      data: {
        attemptRate: 80,
        completionRate: 95,
        topicAccuracy: { React: 80 },
        difficultyAccuracy: { Hard: 50 },
        sectionAccuracy: { Frontend: 92 },
      },
    } as any);

    render(<PerformanceAnalyticsPage />);
    expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
    expect(screen.getByText('Attempt Rate')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });
});
