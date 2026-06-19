import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RuleFlagsTab } from '../components/rule-flags-tab';
import { useRuleFlags, useUpdateRuleFlags } from '../hooks/use-rule-flags';

jest.mock('../hooks/use-rule-flags');
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('RuleFlagsTab', () => {
  const mockConfigId = 'config-1';
  const mockUpdateRuleFlags = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUpdateRuleFlags as jest.Mock).mockReturnValue({
      mutate: mockUpdateRuleFlags,
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

  it('renders default switches and allows toggling', () => {
    (useRuleFlags as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });
    render(<RuleFlagsTab configId={mockConfigId} />);
    expect(screen.getByText('Negative Marking')).toBeInTheDocument();

    // Test initial free navigation switch
    const freeNavSwitch = screen.getByRole('switch', { name: /free navigation/i });
    expect(freeNavSwitch).toBeChecked();
  });

  it('disables free navigation when section locking is enabled', async () => {
    (useRuleFlags as jest.Mock).mockReturnValue({
      data: {
        sectionLockingEnabled: false,
        freeNavigationEnabled: true,
      },
      isLoading: false,
    });

    render(<RuleFlagsTab configId={mockConfigId} />);

    const sectionLockSwitch = screen.getByRole('switch', { name: /section locking/i });
    const freeNavSwitch = screen.getByRole('switch', { name: /free navigation/i });

    expect(freeNavSwitch).not.toBeDisabled();

    // Enable section locking
    fireEvent.click(sectionLockSwitch);

    await waitFor(() => {
      expect(freeNavSwitch).toBeDisabled();
      expect(freeNavSwitch).not.toBeChecked();
      expect(
        screen.getByText(/Free Navigation is disabled because Section Locking is enabled/i),
      ).toBeInTheDocument();
    });
  });

  it('calls update mutation on save', async () => {
    (useRuleFlags as jest.Mock).mockReturnValue({
      data: {
        negativeMarkingEnabled: false,
        randomizeQuestions: false,
        randomizeOptions: false,
        calculatorAllowed: false,
        sectionLockingEnabled: false,
        freeNavigationEnabled: true,
      },
      isLoading: false,
    });

    render(<RuleFlagsTab configId={mockConfigId} />);

    fireEvent.click(screen.getByRole('button', { name: /save rules/i }));

    await waitFor(() => {
      expect(mockUpdateRuleFlags).toHaveBeenCalledWith(
        expect.objectContaining({
          negativeMarkingEnabled: false,
          freeNavigationEnabled: true,
        }),
        expect.any(Object),
      );
    });
  });
});
