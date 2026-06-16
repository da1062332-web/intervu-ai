// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DifficultyDistributionTab } from '../components/difficulty-distribution-tab';
import { useDifficultyDistribution, useUpdateDifficultyDistribution } from '../hooks/use-difficulty-distribution';
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
  const mockUpdateDistribution = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDifficultyDistribution as jest.Mock).mockReturnValue({
      data: { easyCount: 1, mediumCount: 2, hardCount: 3 },
      isLoading: false,
    });
    (useUpdateDifficultyDistribution as jest.Mock).mockReturnValue({
      mutate: mockUpdateDistribution,
      isPending: false,
    });
  });

  it('renders correctly with initial data', () => {
    render(<DifficultyDistributionTab configId={mockConfigId} />);
    expect(screen.getByLabelText(/Easy Questions/i)).toHaveValue(1);
    expect(screen.getByLabelText(/Medium Questions/i)).toHaveValue(2);
    expect(screen.getByLabelText(/Hard Questions/i)).toHaveValue(3);
    // Live total calculation: 1+2+3 = 6
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('updates live total calculation without API call', () => {
    render(<DifficultyDistributionTab configId={mockConfigId} />);
    
    const easyInput = screen.getByLabelText(/Easy Questions/i);
    fireEvent.change(easyInput, { target: { value: '5' } });
    
    // Live total calculation: 5+2+3 = 10
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('validates negative values on input', () => {
    render(<DifficultyDistributionTab configId={mockConfigId} />);
    
    const easyInput = screen.getByLabelText(/Easy Questions/i);
    fireEvent.change(easyInput, { target: { value: '-5' } });
    
    // Math.max(0, -5) -> 0
    expect(easyInput).toHaveValue(0);
  });

  it('shows error if total is zero on save', () => {
    (useDifficultyDistribution as jest.Mock).mockReturnValue({
      data: { easyCount: 0, mediumCount: 0, hardCount: 0 },
      isLoading: false,
    });

    render(<DifficultyDistributionTab configId={mockConfigId} />);
    
    const saveButton = screen.getByText(/Save Distribution/i);
    fireEvent.click(saveButton);

    expect(toast.error).toHaveBeenCalledWith('Invalid Distribution', expect.any(Object));
    expect(mockUpdateDistribution).not.toHaveBeenCalled();
  });

  it('calls mutation and shows success toast on successful save', async () => {
    render(<DifficultyDistributionTab configId={mockConfigId} />);
    
    const saveButton = screen.getByText(/Save Distribution/i);
    fireEvent.click(saveButton);

    expect(mockUpdateDistribution).toHaveBeenCalledWith(
      { easyCount: 1, mediumCount: 2, hardCount: 3 },
      expect.any(Object)
    );

    // Simulate success callback
    const callbacks = mockUpdateDistribution.mock.calls[0][1];
    callbacks.onSuccess();

    expect(toast.success).toHaveBeenCalledWith('Success', expect.any(Object));
  });
});
