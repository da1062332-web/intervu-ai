import React from 'react';
import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SectionFormModal } from '../SectionFormModal';

describe('SectionFormModal UI', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly as a scrollable modal with sticky header and footer', () => {
    render(<SectionFormModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const heading = screen.getByRole('heading', { name: /Add Section/i });
    const headerWrapper = heading.parentElement;
    expect(headerWrapper).toHaveClass('sticky', 'top-0');

    const saveBtn = screen.getByRole('button', { name: /Save/i });
    const footerWrapper = saveBtn.parentElement;
    expect(footerWrapper).toHaveClass('sticky', 'bottom-0');
  });

  it('maintains accessibility features', async () => {
    render(<SectionFormModal {...defaultProps} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('submits on Enter key inside the form', async () => {
    const { container } = render(<SectionFormModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Section Name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Section Code/i), { target: { value: 'TEST' } });

    const form = container.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test',
          code: 'TEST',
        }),
      );
    });
  });
});
