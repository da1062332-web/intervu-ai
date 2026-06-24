import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import BlueprintCompilePage from '../[id]/compile/page';
import * as blueprintServices from '@/services/blueprints/hooks';

// Mock Next.js routing
vi.mock('next/link', () => {
  return {
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
  };
});

vi.mock('next/navigation', () => {
  return {
    useParams: () => ({ id: 'bp-123' }),
    useRouter: () => ({ push: vi.fn() }),
  };
});

// Mock hooks
vi.mock('@/services/blueprints/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/blueprints/hooks')>();
  return {
    ...actual,
    useBlueprint: vi.fn(),
    useCompilationPreview: vi.fn(),
    useCompilationHealth: vi.fn(),
    useCompileBlueprint: vi.fn(),
  };
});

describe('BlueprintCompilePage', () => {
  const mockRefetchPreview = vi.fn();
  const mockRefetchHealth = vi.fn();
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (blueprintServices.useBlueprint as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { id: 'bp-123', name: 'Software Engineer Screening', configId: 'config-123' },
      isLoading: false,
    });

    (blueprintServices.useCompileBlueprint as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  it('renders loading skeleton when queries are active', () => {
    (blueprintServices.useCompilationPreview as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: mockRefetchPreview,
    });
    (blueprintServices.useCompilationHealth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: mockRefetchHealth,
    });

    const { container } = render(<BlueprintCompilePage />);
    // Verify animate-pulse container is rendered
    expect(container.getElementsByClassName('animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders compilation health checks correctly', () => {
    (blueprintServices.useCompilationPreview as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { sections: [], requests: [] },
      isLoading: false,
      refetch: mockRefetchPreview,
    });

    (blueprintServices.useCompilationHealth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        valid: true,
        checks: {
          templatesAvailable: { status: 'PASS', message: 'All active templates found' },
          conceptsAvailable: { status: 'PASS', message: 'Concepts mapped' },
          difficultyCoverage: { status: 'PASS', message: 'Ratios correct' },
          generationReady: { status: 'PASS', message: 'Readiness report valid' },
        },
        errors: [],
      },
      isLoading: false,
      refetch: mockRefetchHealth,
    });

    render(<BlueprintCompilePage />);

    expect(screen.getByText('Templates Available')).toBeInTheDocument();
    expect(screen.getByText('Concepts Available')).toBeInTheDocument();
    expect(screen.getByText('Blueprint & Difficulty Specs')).toBeInTheDocument();
    expect(screen.getByText('Exam Configuration Ready')).toBeInTheDocument();
    expect(screen.getByText('All active templates found')).toBeInTheDocument();
    expect(screen.getByText('VALID & READY')).toBeInTheDocument();
  });

  it('renders warnings and disables compile button if readiness report is not READY', () => {
    (blueprintServices.useCompilationPreview as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { sections: [], requests: [] },
      isLoading: false,
      refetch: mockRefetchPreview,
    });

    (blueprintServices.useCompilationHealth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        valid: false,
        checks: {
          templatesAvailable: { status: 'PASS', message: 'All active templates found' },
          conceptsAvailable: { status: 'PASS', message: 'Concepts mapped' },
          difficultyCoverage: { status: 'PASS', message: 'Ratios correct' },
          generationReady: { status: 'FAIL', message: 'Readiness report invalid' },
        },
        errors: ['Readiness Not READY'],
      },
      isLoading: false,
      refetch: mockRefetchHealth,
    });

    render(<BlueprintCompilePage />);

    // Warning banner should be present
    expect(screen.getByText('Generation Disabled: Exam Configuration Not Ready')).toBeInTheDocument();
    expect(screen.getByText('INVALID')).toBeInTheDocument();

    // Compile button should be disabled
    const button = screen.getByRole('button', { name: /Execute Blueprint Compilation/i });
    expect(button).toBeDisabled();
  });

  it('triggers compilation mutation on click when ready', async () => {
    (blueprintServices.useCompilationPreview as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { sections: [], requests: [] },
      isLoading: false,
      refetch: mockRefetchPreview,
    });

    (blueprintServices.useCompilationHealth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        valid: true,
        checks: {
          templatesAvailable: { status: 'PASS', message: 'All active templates found' },
          conceptsAvailable: { status: 'PASS', message: 'Concepts mapped' },
          difficultyCoverage: { status: 'PASS', message: 'Ratios correct' },
          generationReady: { status: 'PASS', message: 'Readiness report valid' },
        },
        errors: [],
      },
      isLoading: false,
      refetch: mockRefetchHealth,
    });

    mockMutateAsync.mockResolvedValue({ batchId: 'batch-abc-123', requestCount: 10 });

    render(<BlueprintCompilePage />);

    const button = screen.getByRole('button', { name: /Execute Blueprint Compilation/i });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('bp-123');
    });
  });
});
