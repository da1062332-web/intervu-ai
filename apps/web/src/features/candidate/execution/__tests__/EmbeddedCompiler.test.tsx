import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmbeddedCompiler } from '../components/EmbeddedCompiler';
import { apiClient } from '@/services/api/client';
import { useExecutionStore } from '../stores/execution.store';

vi.mock('@/services/api/client', () => ({
  apiClient: {
    request: vi.fn(),
  },
}));

vi.mock('../stores/execution.store', () => ({
  useExecutionStore: vi.fn(),
}));

// Mock Monaco editor for Vitest JSDOM environment
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid='mock-monaco-editor'
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

describe('EmbeddedCompiler Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useExecutionStore as any).mockReturnValue({
      currentQuestion: { id: 'q-coding-1' },
      testInstance: { id: 'test-inst-1' },
    });
  });

  it('renders compiler container with language selector and Run Code button', () => {
    render(<EmbeddedCompiler questionId='q-coding-1' onChange={mockOnChange} />);

    expect(screen.getByTitle('Code Compiler')).toBeInTheDocument();
    expect(screen.getByText('Judge0 Compiler')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Run Code/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('allows language selection and invokes onChange', () => {
    render(<EmbeddedCompiler questionId='q-coding-1' onChange={mockOnChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'cpp' } });

    expect((select as HTMLSelectElement).value).toBe('cpp');
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('triggers POST /coding/run when Run Code is clicked and displays per-test results', async () => {
    (apiClient.request as any).mockResolvedValueOnce({
      success: true,
      questionId: 'q-coding-1',
      summary: { total: 1, passed: 1, failed: 0 },
      results: [
        {
          testIndex: 1,
          status: 'PASSED',
          input: { arr: [1, 2, 3], shift: 1 },
          expectedOutput: { result: [2, 3, 1] },
          actualOutput: '[2, 3, 1]',
          runtimeSeconds: 0.015,
          memoryKb: 12800,
          error: null,
        },
      ],
    });

    render(
      <EmbeddedCompiler
        questionId='q-coding-1'
        testInstanceId='test-inst-1'
        onChange={mockOnChange}
      />,
    );

    const runBtn = screen.getByRole('button', { name: /Run Code/i });
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalledWith(
        '/coding/run',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            questionId: 'q-coding-1',
            testInstanceId: 'test-inst-1',
            language: 'java',
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Public Test Cases Evaluation/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Case #1/i)).toBeInTheDocument();
      expect(screen.getByText(/0.015s/i)).toBeInTheDocument();
    });
  });
});
