import { render, screen } from '@testing-library/react';
import { ValidationWidget } from '../ValidationWidget';
import { useTemplatePreviewStore } from '@/store/template-preview.store';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/store/template-preview.store');

describe('ValidationWidget', () => {
  it('should show success message when all variables are valid', () => {
    (useTemplatePreviewStore as any).mockReturnValue({
      previewResult: { validation: { valid: true, unknownVariables: [] } },
    });

    render(<ValidationWidget />);

    expect(screen.getByText(/All Variables Resolved Successfully/i)).toBeInTheDocument();
  });

  it('should show unknown variables when invalid', () => {
    (useTemplatePreviewStore as any).mockReturnValue({
      previewResult: { validation: { valid: false, unknownVariables: ['missing_var'] } },
    });

    render(<ValidationWidget />);

    expect(screen.getByText(/Missing or Unknown Variables Detected/i)).toBeInTheDocument();
    expect(screen.getByText('missing_var')).toBeInTheDocument();
  });
});
