import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecommendationPanel } from '../components/RecommendationPanel';
import { useResultRecommendations } from '../hooks/results.hooks';

vi.mock('../hooks/results.hooks', () => ({
  useResultRecommendations: vi.fn(),
}));

describe('RecommendationPanel', () => {
  it('renders recommendations', () => {
    vi.mocked(useResultRecommendations).mockReturnValue({
      isLoading: false,
      data: {
        practiceSuggestions: ['Practice A'],
        focusTopics: ['Topic A', 'Topic B'],
        improvementPlan: ['Step 1'],
        estimatedPracticeHours: 10,
        priority: 'Medium'
      },
    } as any);

    render(<RecommendationPanel attemptId='test-123' />);
    expect(screen.getByText('10 Hours')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Topic A')).toBeInTheDocument();
  });
});
