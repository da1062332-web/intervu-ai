import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GenerationReadinessPanel } from '../components/GenerationReadinessPanel';
import { useConfigurationValidation } from '../hooks/useConfigurationValidation';

vi.mock('../hooks/useConfigurationValidation', () => ({
  useConfigurationValidation: vi.fn(),
}));

vi.mock('@/services/blueprints/hooks', () => ({
  useBlueprints: vi.fn(() => ({ data: [] })),
}));

describe('GenerationReadinessPanel UI Components', () => {
  const mockConfigId = 'config-e2e-123';
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons when querying', () => {
    vi.mocked(useConfigurationValidation).mockReturnValue({
      isLoading: true,
      isError: false,
      data: null,
      refresh: mockRefresh,
      isRefreshing: false,
    } as any);

    const { container } = render(<GenerationReadinessPanel configId={mockConfigId} />);
    expect(container.getElementsByClassName('animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders validation error state', () => {
    vi.mocked(useConfigurationValidation).mockReturnValue({
      isLoading: false,
      isError: true,
      data: null,
      refresh: mockRefresh,
      isRefreshing: false,
    } as any);

    render(<GenerationReadinessPanel configId={mockConfigId} />);
    expect(screen.getByText(/Validation Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to run readiness checks/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('renders readiness score and checks breakdown status correctly', () => {
    vi.mocked(useConfigurationValidation).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        score: 75,
        status: 'NOT_READY',
        checks: [],
        report: {
          fixes: [{ type: 'mismatched_totals', message: 'Mismatched topic totals' }],
        },
      },
      refresh: mockRefresh,
      isRefreshing: false,
    } as any);

    render(<GenerationReadinessPanel configId={mockConfigId} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText(/NOT READY/i)).toBeInTheDocument();
    expect(screen.getByText(/Actionable Fixes \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText('Mismatched topic totals')).toBeInTheDocument();
  });

  it('renders perfect readiness score status correctly', () => {
    vi.mocked(useConfigurationValidation).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        score: 100,
        status: 'READY',
        checks: [],
        report: {
          fixes: [],
        },
      },
      refresh: mockRefresh,
      isRefreshing: false,
    } as any);

    render(<GenerationReadinessPanel configId={mockConfigId} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText(/^READY$/i)).toBeInTheDocument();
    expect(screen.getByText(/No actionable fixes found/i)).toBeInTheDocument();
  });
});
