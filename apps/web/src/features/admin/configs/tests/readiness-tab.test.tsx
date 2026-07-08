import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GenerationReadinessPanel } from '../components/GenerationReadinessPanel';
import { useConfigurationValidation } from '../hooks/useConfigurationValidation';

vi.mock('../hooks/useConfigurationValidation', () => ({
  useConfigurationValidation: vi.fn(),
}));

describe('GenerationReadinessPanel UI Components', () => {
  const mockConfigId = 'config-e2e-123';
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeletons when querying', () => {
    vi.mocked(useConfigurationValidation).mockReturnValue({
      isLoading: true,
      isError: false,
      data: null,
      refetch: mockRefetch,
    } as any);

    const { container } = render(<GenerationReadinessPanel configId={mockConfigId} />);
    expect(container.getElementsByClassName('animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders validation error state', () => {
    vi.mocked(useConfigurationValidation).mockReturnValue({
      isLoading: false,
      isError: true,
      data: null,
      refetch: mockRefetch,
    } as any);

    render(<GenerationReadinessPanel configId={mockConfigId} />);
    expect(screen.getByText(/Validation Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to run readiness checks/i)).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders readiness score and checks breakdown status correctly', () => {
    vi.mocked(useConfigurationValidation).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        valid: false,
        readiness: 75,
        errors: ['Mismatched topic totals'],
        warnings: [],
      },
      refetch: mockRefetch,
    } as any);

    render(<GenerationReadinessPanel configId={mockConfigId} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText(/Ready: NO/i)).toBeInTheDocument();
    expect(screen.getByText('Blocking Issues (1)')).toBeInTheDocument();
    expect(screen.getByText('Mismatched topic totals')).toBeInTheDocument();
  });

  it('renders perfect readiness score status correctly', () => {
    vi.mocked(useConfigurationValidation).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        valid: true,
        readiness: 100,
        errors: [],
        warnings: [],
      },
      refetch: mockRefetch,
    } as any);

    render(<GenerationReadinessPanel configId={mockConfigId} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText(/Ready: YES/i)).toBeInTheDocument();
    expect(screen.getByText('No blocking issues found.')).toBeInTheDocument();
  });
});
