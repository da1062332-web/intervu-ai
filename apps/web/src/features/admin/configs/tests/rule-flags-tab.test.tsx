import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RuleFlagsTab } from '../components/rule-flags-tab';
import { useRuleFlags, useSaveRules } from '../hooks/use-rule-flags';
import { toast } from 'sonner';

jest.mock('../hooks/use-rule-flags');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('RuleFlagsTab', () => {
  const mockConfigId = 'config-1';
  const mockSaveRules = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSaveRules as jest.Mock).mockReturnValue({
      mutate: mockSaveRules,
      isPending: false,
    });
  });

  it('renders loading state', () => {
    (useRuleFlags as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    render(<RuleFlagsTab configId={mockConfigId} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders switches and allows toggling', async () => {
    (useRuleFlags as jest.Mock).mockReturnValue({
      data: {
        negativeMarkingEnabled: true,
        sectionalCutoffEnabled: false,
        adaptiveDifficultyEnabled: true,
        shuffleQuestionsEnabled: false,
        shuffleOptionsEnabled: true,
        allowSectionNavigation: false,
      },
      isLoading: false,
    });

    render(<RuleFlagsTab configId={mockConfigId} />);

    expect(screen.getByText('Negative Marking')).toBeInTheDocument();
    expect(screen.getByText('Sectional Cutoff')).toBeInTheDocument();
    expect(screen.getByText('Adaptive Difficulty')).toBeInTheDocument();
    expect(screen.getByText('Shuffle Questions')).toBeInTheDocument();
    expect(screen.getByText('Shuffle Options')).toBeInTheDocument();
    expect(screen.getByText('Allow Section Navigation')).toBeInTheDocument();

    const negativeMarkingSwitch = screen.getByRole('switch', { name: /Negative Marking/i });
    const sectionalCutoffSwitch = screen.getByRole('switch', { name: /Sectional Cutoff/i });

    expect(negativeMarkingSwitch).toBeChecked();
    expect(sectionalCutoffSwitch).not.toBeChecked();

    // Toggle sectional cutoff
    fireEvent.click(sectionalCutoffSwitch);
    expect(sectionalCutoffSwitch).toBeChecked();
  });

  it('calls update mutation on save', async () => {
    (useRuleFlags as jest.Mock).mockReturnValue({
      data: {
        negativeMarkingEnabled: false,
        sectionalCutoffEnabled: false,
        adaptiveDifficultyEnabled: false,
        shuffleQuestionsEnabled: false,
        shuffleOptionsEnabled: false,
        allowSectionNavigation: true,
      },
      isLoading: false,
    });

    render(<RuleFlagsTab configId={mockConfigId} />);

    fireEvent.click(screen.getByRole('button', { name: /save rules/i }));

    await waitFor(() => {
      expect(mockSaveRules).toHaveBeenCalledWith(
        expect.objectContaining({
          negativeMarkingEnabled: false,
          allowSectionNavigation: true,
        }),
        expect.any(Object),
      );
    });
  });
});
