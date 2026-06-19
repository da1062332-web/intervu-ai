/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DifficultyDistributionTab } from '../components/difficulty-distribution-tab';
import {
  useDifficultyDistribution,
  useSaveDistribution,
} from '../hooks/use-difficulty-distribution';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('../hooks/use-difficulty-distribution');
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('DifficultyDistributionTab', () => {
  const mockConfigId = 'd8f8d6d4-8d9e-4f1a-b6e9-9c5d8a8b1c1d';
  const mockSaveDistribution = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDifficultyDistribution as jest.Mock).mockReturnValue({
      data: { easyPercentage: 30, mediumPercentage: 50, hardPercentage: 20 },
      isLoading: false,
    });
    (useSaveDistribution as jest.Mock).mockReturnValue({
      mutate: mockSaveDistribution,
      isPending: false,
    });
  });

  it('renders correctly with initial data', () => {
    render(<DifficultyDistributionTab configId={mockConfigId} />);
    (expect(screen.getByLabelText(/Easy %/i)) as any).toHaveValue(30);
    (expect(screen.getByLabelText(/Medium %/i)) as any).toHaveValue(50);
    (expect(screen.getByLabelText(/Hard %/i)) as any).toHaveValue(20);
    // Live total calculation: 30+50+20 = 100
    (expect(screen.getByText('100%')) as any).toBeInTheDocument();
  });

  it('updates live total calculation without API call', () => {
    render(<DifficultyDistributionTab configId={mockConfigId} />);

    const easyInput = screen.getByLabelText(/Easy %/i);
    fireEvent.change(easyInput, { target: { value: '40' } });

    // Live total calculation: 40+50+20 = 110
    (expect(screen.getByText('110%')) as any).toBeInTheDocument();
  });

  it('validates negative values on input', () => {
    render(<DifficultyDistributionTab configId={mockConfigId} />);

    const easyInput = screen.getByLabelText(/Easy %/i);
    fireEvent.change(easyInput, { target: { value: '-5' } });

    // Math.max(0, -5) -> 0
    (expect(easyInput) as any).toHaveValue(0);
  });

  it('shows error if total is not 100% on save', () => {
    (useDifficultyDistribution as jest.Mock).mockReturnValue({
      data: { easyPercentage: 20, mediumPercentage: 20, hardPercentage: 20 },
      isLoading: false,
    });

    render(<DifficultyDistributionTab configId={mockConfigId} />);

    const saveButton = screen.getByText(/Save Distribution/i);
    fireEvent.click(saveButton);

    expect(toast.error).toHaveBeenCalledWith('Invalid Distribution', expect.any(Object));
    expect(mockSaveDistribution).not.toHaveBeenCalled();
  });

  it('calls mutation and shows success toast on successful save', async () => {
    render(<DifficultyDistributionTab configId={mockConfigId} />);

    const saveButton = screen.getByText(/Save Distribution/i);
    fireEvent.click(saveButton);

    expect(mockSaveDistribution).toHaveBeenCalledWith(
      { easyPercentage: 30, mediumPercentage: 50, hardPercentage: 20 },
      expect.any(Object),
    );

    // Simulate success callback
    const callbacks = mockSaveDistribution.mock.calls[0][1];
    callbacks.onSuccess();

    expect(toast.success).toHaveBeenCalledWith('Success', expect.any(Object));
  });
});
