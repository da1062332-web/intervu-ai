import { render, screen } from '@testing-library/react';
import { PreviewBuilder } from '../PreviewBuilder';
import { useTemplatePreviewStore } from '@/store/template-preview.store';
import { useGeneratePreview } from '@/services/templates/hooks';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/store/template-preview.store');
vi.mock('@/services/templates/hooks');
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '123' })
}));

describe('PreviewBuilder', () => {
  it('should render the generate preview button', () => {
    (useTemplatePreviewStore as any).mockReturnValue({
      previewInput: '{}',
      setPreviewInput: vi.fn(),
      setPreviewResult: vi.fn(),
    });
    
    (useGeneratePreview as any).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    
    render(<PreviewBuilder />);
    
    expect(screen.getByRole('button', { name: /Generate Preview/i })).toBeInTheDocument();
  });
});
