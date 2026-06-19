import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { BlueprintBuilderPageClient } from '../BlueprintBuilderPageClient';
import * as blueprintServices from '@/services/blueprints/hooks';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('?id=test-id'),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/services/blueprints/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/blueprints/hooks')>();
  return {
    ...actual,
    useBlueprint: vi.fn(),
    useUpdateBlueprint: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
    useAddBlueprintTopic: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
  };
});

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: [] }),
}));

describe('BlueprintBuilderPageClient', () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    (blueprintServices.useBlueprint as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    const { container } = render(<BlueprintBuilderPageClient />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders validation summary and info correctly', () => {
    const mockBlueprint = {
      id: 'test-id',
      name: 'Test Blueprint',
      code: 'TB_01',
      description: 'Desc',
      totalQuestions: 40,
      totalDurationMinutes: 90,
      isActive: true,
      valid: true,
      validationSummary: {
        totalConfiguredQuestions: 40,
        totalExpectedQuestions: 40,
        totalMissingQuestions: 0,
        totalWeightage: 100,
        errors: [],
      },
      topics: [
        {
          sectionName: 'Core',
          topicName: 'React',
          questionCount: 40,
          weightage: 100,
          difficultyDistribution: { easyCount: 10, mediumCount: 20, hardCount: 10 },
        },
      ],
    };

    (blueprintServices.useBlueprint as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockBlueprint,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });

    render(<BlueprintBuilderPageClient />);

    expect(screen.getByText('Test Blueprint')).toBeInTheDocument();
    expect(screen.getByText('TB_01')).toBeInTheDocument();
    expect(screen.getByText('VALID')).toBeInTheDocument();
    expect(screen.getAllByText('100%')[0]).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });
});
