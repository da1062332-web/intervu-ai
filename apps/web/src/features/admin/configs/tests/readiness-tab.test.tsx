import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReadinessTab } from '../components/readiness-tab';
import { useReadiness, useGenerateReadiness } from '../hooks/use-readiness';
import { useReadinessStore } from '@/store/readiness.store';

vi.mock('../hooks/use-readiness', () => ({
  useReadiness: vi.fn(),
  useGenerateReadiness: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ReadinessTab UI Components', () => {
  const mockConfigId = 'config-e2e-123';
  const mockTabChange = vi.fn();
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useReadinessStore.getState().reset();

    vi.mocked(useReadiness).mockReturnValue({
      isLoading: false,
    } as unknown as ReturnType<typeof useReadiness>);

    vi.mocked(useGenerateReadiness).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useGenerateReadiness>);
  });

  it('renders loading spinner when querying', () => {
    vi.mocked(useReadiness).mockReturnValue({
      isLoading: true,
    } as unknown as ReturnType<typeof useReadiness>);

    render(<ReadinessTab configId={mockConfigId} onTabChange={mockTabChange} />);
    expect(screen.getByText(/Running readiness validation audit.../i)).toBeInTheDocument();
  });

  it('renders dashboard score progress and breakdown status correctly', () => {
    useReadinessStore.getState().setReadinessReport({
      score: 80,
      status: 'PARTIALLY_READY',
      checks: [
        { name: 'Exam Config Exists', status: 'PASS' },
        { name: 'Blueprint Valid', status: 'FAIL', message: 'Mismatched topic totals' },
      ],
      report: {
        layerBreakdown: {
          configuration: 'PASS',
          knowledge: 'PASS',
          templates: 'PASS',
          blueprint: 'FAIL',
        },
        fixes: [
          { type: 'blueprint', message: 'Mismatched topic totals', tab: 'sections' },
        ],
      },
    });

    render(<ReadinessTab configId={mockConfigId} onTabChange={mockTabChange} />);

    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText(/PARTIALLY READY/i)).toBeInTheDocument();

    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Knowledge Layer')).toBeInTheDocument();
    expect(screen.getByText('Template Library')).toBeInTheDocument();
    expect(screen.getByText('Blueprint Layout')).toBeInTheDocument();

    const fixButton = screen.getAllByText('Mismatched topic totals')[1];
    expect(fixButton).toBeInTheDocument();
    fireEvent.click(fixButton);
    expect(mockTabChange).toHaveBeenCalledWith('sections');
  });

  it('re-evaluates report when Recalculate button is clicked', () => {
    useReadinessStore.getState().setReadinessReport({
      score: 100,
      status: 'READY',
      checks: [],
      report: {
        layerBreakdown: {
          configuration: 'PASS',
          knowledge: 'PASS',
          templates: 'PASS',
          blueprint: 'PASS',
        },
        fixes: [],
      },
    });

    render(<ReadinessTab configId={mockConfigId} onTabChange={mockTabChange} />);

    const recalculateButton = screen.getByRole('button', { name: /Recalculate Readiness/i });
    fireEvent.click(recalculateButton);

    expect(mockMutate).toHaveBeenCalled();
  });
});
