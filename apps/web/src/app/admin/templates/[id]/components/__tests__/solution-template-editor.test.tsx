import { render, screen } from '@testing-library/react';
import { SolutionTemplateEditor } from '../SolutionTemplateEditor';
import { useTemplatePreviewStore } from '@/store/template-preview.store';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/store/template-preview.store');

describe('SolutionTemplateEditor', () => {
  it('should render solution and explanation textareas', () => {
    (useTemplatePreviewStore as any).mockReturnValue({
      solutionTemplate: '',
      explanationTemplate: '',
      setSolutionTemplate: vi.fn(),
      setExplanationTemplate: vi.fn(),
    });

    render(<SolutionTemplateEditor />);

    expect(screen.getByText(/Solution Template/i)).toBeInTheDocument();
    expect(screen.getByText(/Explanation Template/i)).toBeInTheDocument();
  });
});
