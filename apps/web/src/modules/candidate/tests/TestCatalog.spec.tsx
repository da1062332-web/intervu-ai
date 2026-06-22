import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestCatalogPage } from '../pages/TestCatalogPage';
import { useTestCatalog } from '../hooks/useTestCatalog';
import { useTestCatalogStore } from '../stores/testCatalog.store';

// Mock navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock hook
vi.mock('../hooks/useTestCatalog', () => ({
  useTestCatalog: vi.fn(),
}));

describe('TestCatalogPage component', () => {
  const mockTests = [
    {
      id: 'test-1',
      company: 'TCS',
      title: 'TCS NQT',
      description: 'Cognitive check',
      durationMinutes: 90,
      totalQuestions: 60,
      difficulty: 'Medium',
      sections: [],
    },
    {
      id: 'test-2',
      company: 'Meta',
      title: 'React Core',
      description: 'Hooks check',
      durationMinutes: 60,
      totalQuestions: 40,
      difficulty: 'Hard',
      sections: [],
    },
    {
      id: 'test-3',
      company: 'Google',
      title: 'Go Basics',
      description: 'Syntax check',
      durationMinutes: 45,
      totalQuestions: 30,
      difficulty: 'Easy',
      sections: [],
    },
  ];

  beforeEach(() => {
    useTestCatalogStore.getState().resetFilters();
    (useTestCatalog as any).mockReturnValue({
      data: mockTests,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('renders filters and list of tests', () => {
    render(<TestCatalogPage />);
    expect(screen.getByText('TCS NQT')).toBeInTheDocument();
    expect(screen.getByText('React Core')).toBeInTheDocument();
    expect(screen.getByText('Go Basics')).toBeInTheDocument();
  });

  it('filters tests by search input', () => {
    render(<TestCatalogPage />);
    const searchInput = screen.getByPlaceholderText(/e.g. TCS NQT, Meta, Python/i);
    fireEvent.change(searchInput, { target: { value: 'React' } });

    expect(screen.queryByText('TCS NQT')).not.toBeInTheDocument();
    expect(screen.getByText('React Core')).toBeInTheDocument();
  });

  it('filters tests by difficulty buttons', () => {
    render(<TestCatalogPage />);

    // Click 'Hard' filter
    const hardBtn = screen.getByRole('button', { name: /^Hard$/i });
    fireEvent.click(hardBtn);

    expect(screen.queryByText('TCS NQT')).not.toBeInTheDocument();
    expect(screen.queryByText('Go Basics')).not.toBeInTheDocument();
    expect(screen.getByText('React Core')).toBeInTheDocument();
  });
});
