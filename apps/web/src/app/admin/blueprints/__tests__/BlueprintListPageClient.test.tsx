import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { BlueprintListPageClient } from '../BlueprintListPageClient';
import * as blueprintServices from '@/services/blueprints/hooks';

// Mock Next.js routing
vi.mock('next/link', () => {
  return {
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
  };
});

// Mock services
vi.mock('@/services/blueprints/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/blueprints/hooks')>();
  return {
    ...actual,
    useBlueprints: vi.fn(),
    useDeleteBlueprint: vi.fn(),
    useCreateBlueprint: vi.fn().mockReturnValue({ mutateAsync: vi.fn(), isPending: false }),
  };
});

describe('BlueprintListPageClient', () => {
  const mockRefetch = vi.fn();
  const mockDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    (blueprintServices.useDeleteBlueprint as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: mockDelete,
      isPending: false,
    });
  });

  it('renders loading state correctly', () => {
    (blueprintServices.useBlueprints as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mockRefetch,
      isFetching: true,
    });

    render(<BlueprintListPageClient />);
    // The loading skeleton elements don't have text, but we can verify the Create Blueprint button is there
    expect(screen.getByText('Create Blueprint')).toBeInTheDocument();
  });

  it('renders error state correctly and allows retry', () => {
    (blueprintServices.useBlueprints as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
      isFetching: false,
    });

    render(<BlueprintListPageClient />);
    expect(screen.getByText('Unable to load blueprints.')).toBeInTheDocument();

    const retryBtn = screen.getByText('Retry');
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders empty state correctly', () => {
    (blueprintServices.useBlueprints as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });

    render(<BlueprintListPageClient />);
    expect(screen.getByText('No Blueprints Found')).toBeInTheDocument();
  });

  it('renders list of blueprints successfully', () => {
    const mockBlueprints = [
      {
        id: '1',
        name: 'Backend Engineer L1',
        code: 'BE_L1',
        totalQuestions: 50,
        totalDurationMinutes: 120,
        isActive: true,
      },
      {
        id: '2',
        name: 'Frontend Engineer L2',
        code: 'FE_L2',
        totalQuestions: 40,
        totalDurationMinutes: 90,
        isActive: false,
      },
    ];

    (blueprintServices.useBlueprints as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockBlueprints,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
      isFetching: false,
    });

    render(<BlueprintListPageClient />);

    expect(screen.getByText('Backend Engineer L1')).toBeInTheDocument();
    expect(screen.getByText('BE_L1')).toBeInTheDocument();

    expect(screen.getByText('Frontend Engineer L2')).toBeInTheDocument();
    expect(screen.getByText('FE_L2')).toBeInTheDocument();
  });
});
