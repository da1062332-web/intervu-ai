import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NavigationControls } from '../components/NavigationControls';
import { useExecutionStore } from '../stores/execution.store';

vi.mock('../stores/execution.store', () => ({
  useExecutionStore: vi.fn(),
}));

describe('NavigationControls', () => {
  const mockGoNext = vi.fn();
  const mockGoPrevious = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('disables Previous button on first question', () => {
    (useExecutionStore as any).mockReturnValue({
      currentQuestionIndex: 0,
      questions: [{}, {}],
      goNext: mockGoNext,
      goPrevious: mockGoPrevious,
    });

    render(<NavigationControls onSubmitClick={mockOnSubmit} />);
    const prevButton = screen.getByText(/Previous/i);
    expect(prevButton).toBeDisabled();
  });

  it('calls goNext when Next is clicked', () => {
    (useExecutionStore as any).mockReturnValue({
      currentQuestionIndex: 0,
      questions: [{}, {}],
      goNext: mockGoNext,
      goPrevious: mockGoPrevious,
    });

    render(<NavigationControls onSubmitClick={mockOnSubmit} />);
    const nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton);
    expect(mockGoNext).toHaveBeenCalled();
  });

  it('shows Submit Assessment on last question of single section test', () => {
    (useExecutionStore as any).mockReturnValue({
      currentQuestionIndex: 1,
      questions: [{}, {}],
      goNext: mockGoNext,
      goPrevious: mockGoPrevious,
      currentSectionIndex: 0,
      testInstance: { sections: [{ questions: [{}, {}] }] },
    });

    render(<NavigationControls onSubmitClick={mockOnSubmit} />);
    const submitButton = screen.getByText(/Submit Assessment/i);
    expect(submitButton).toBeInTheDocument();
    fireEvent.click(submitButton);
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('shows Next Section on last question of Section 1 in multi-section test', () => {
    const mockRequestNextSection = vi.fn();
    (useExecutionStore as any).mockReturnValue({
      currentQuestionIndex: 1,
      questions: [{}, {}, {}, {}],
      goNext: mockGoNext,
      goPrevious: mockGoPrevious,
      requestNextSection: mockRequestNextSection,
      currentSectionIndex: 0,
      testInstance: {
        sections: [
          { questions: [{}, {}] }, // Section 1 (2 questions)
          { questions: [{}, {}] }, // Section 2 (2 questions)
        ],
      },
    });

    render(<NavigationControls onSubmitClick={mockOnSubmit} />);
    const nextSectionButton = screen.getByText(/Next Section/i);
    expect(nextSectionButton).toBeInTheDocument();
    fireEvent.click(nextSectionButton);
    expect(mockRequestNextSection).toHaveBeenCalled();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
