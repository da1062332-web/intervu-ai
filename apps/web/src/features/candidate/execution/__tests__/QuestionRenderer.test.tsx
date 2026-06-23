import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionRenderer } from '../components/QuestionRenderer';
import { useExecutionStore } from '../stores/execution.store';

vi.mock('../stores/execution.store', () => ({
  useExecutionStore: vi.fn(),
}));

describe('QuestionRenderer', () => {
  const mockSaveAnswer = vi.fn();
  const mockToggleReview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseQuestion = {
    id: 'q1',
    questionHash: 'hash',
    text: 'Test Question',
    options: [
      { id: 'opt1', text: 'Option 1' },
      { id: 'opt2', text: 'Option 2' },
    ],
    orderIndex: 0,
  };

  it('renders MCQ question correctly', () => {
    (useExecutionStore as any).mockReturnValue({
      currentQuestion: { ...baseQuestion, type: 'MCQ' },
      currentQuestionIndex: 0,
      answers: {},
      saveAnswer: mockSaveAnswer,
      toggleReview: mockToggleReview,
      testInstance: { id: 'test' },
    });

    render(<QuestionRenderer />);
    expect(screen.getByText('Test Question')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('renders NUMERIC input', () => {
    (useExecutionStore as any).mockReturnValue({
      currentQuestion: { ...baseQuestion, type: 'NUMERIC' },
      currentQuestionIndex: 0,
      answers: {},
      saveAnswer: mockSaveAnswer,
      toggleReview: mockToggleReview,
      testInstance: { id: 'test' },
    });

    render(<QuestionRenderer />);
    expect(screen.getByPlaceholderText('Enter your numeric answer')).toBeInTheDocument();
  });

  it('renders CODING textarea', () => {
    (useExecutionStore as any).mockReturnValue({
      currentQuestion: { ...baseQuestion, type: 'CODING' },
      currentQuestionIndex: 0,
      answers: {},
      saveAnswer: mockSaveAnswer,
      toggleReview: mockToggleReview,
      testInstance: { id: 'test' },
    });

    render(<QuestionRenderer />);
    expect(screen.getByPlaceholderText('// Write your code here...')).toBeInTheDocument();
  });
});
