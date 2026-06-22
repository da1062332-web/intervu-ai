import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestInstructionsPage } from '../pages/TestInstructionsPage';
import { useInstructions } from '../hooks/useInstructions';
import { useDashboardStore } from '../stores/dashboard.store';

// Mock navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock hook
vi.mock('../hooks/useInstructions', () => ({
  useInstructions: vi.fn(),
}));

describe('TestInstructionsPage component', () => {
  const mockConfig = {
    testTitle: 'TCS NQT Cognitive Assessment',
    company: 'Tata Consultancy Services',
    generalRules: ['Rule 1', 'Rule 2'],
    navigationRules: ['Nav Rule 1'],
    technicalRequirements: ['Tech 1'],
  };

  beforeEach(() => {
    mockPush.mockClear();
    (useInstructions as any).mockReturnValue({
      data: mockConfig,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    // Clear accepted instructions store state
    useDashboardStore.setState({ acceptedInstructions: {} });
  });

  it('renders rules and disabled continue button initially', () => {
    render(<TestInstructionsPage testId='test-1' />);
    expect(screen.getByText('TCS NQT Cognitive Assessment')).toBeInTheDocument();
    expect(screen.getByText('Rule 1')).toBeInTheDocument();

    const continueBtn = screen.getByRole('button', { name: /Proceed to System Check/i });
    expect(continueBtn).toBeDisabled();
  });

  it('enables continue button when declaration checkbox is checked and calls router on click', () => {
    render(<TestInstructionsPage testId='test-1' />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    
    const continueBtn = screen.getByRole('button', { name: /Proceed to System Check/i });
    expect(continueBtn).toBeEnabled();

    fireEvent.click(continueBtn);
    expect(mockPush).toHaveBeenCalledWith('/candidate/tests/test-1/launch');
  });

  it('persists checkbox selection state inside Zustand and LocalStorage mock mechanisms', () => {
    render(<TestInstructionsPage testId='test-1' />);
    const checkbox = screen.getByRole('checkbox');
    
    fireEvent.click(checkbox);
    
    // Validate store status
    const storeState = useDashboardStore.getState();
    expect(storeState.acceptedInstructions['test-1']).toBe(true);
  });
});
