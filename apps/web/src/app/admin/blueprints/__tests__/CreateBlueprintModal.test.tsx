import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import toast from 'react-hot-toast';
import { CreateBlueprintModal } from '../components/CreateBlueprintModal';
import * as blueprintServices from '@/services/blueprints/hooks';

vi.mock('@/services/blueprints/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/blueprints/hooks')>();
  return {
    ...actual,
    useCreateBlueprint: vi.fn(),
  };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CreateBlueprintModal', () => {
  const mockCreate = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (blueprintServices.useCreateBlueprint as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: mockCreate,
      isPending: false,
    });
  });

  it('renders nothing when closed', () => {
    render(<CreateBlueprintModal isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText('Create Blueprint')).not.toBeInTheDocument();
  });

  it('renders modal with form fields when open', () => {
    render(<CreateBlueprintModal isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByRole('heading', { name: 'Create Blueprint' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Blueprint Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Code/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Total Questions/)).toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    render(<CreateBlueprintModal isOpen={true} onClose={mockOnClose} />);

    const submitBtn = screen.getByRole('button', { name: /Create Blueprint/i });
    fireEvent.click(submitBtn);

    // HTML5 validation usually catches this, but if JS runs:
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('submits successfully with valid data', async () => {
    mockCreate.mockResolvedValueOnce({});

    render(<CreateBlueprintModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/Blueprint Name/), { target: { value: 'Test BP' } });
    fireEvent.change(screen.getByLabelText(/Code/), { target: { value: 'TEST_001' } });
    fireEvent.change(screen.getByLabelText(/Total Questions/), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/Total Duration/), { target: { value: '60' } });

    const submitBtn = screen.getByRole('button', { name: /Create Blueprint/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: 'Test BP',
        code: 'TEST_001',
        description: '',
        totalQuestions: 30,
        totalDurationMinutes: 60,
        isActive: true,
      });
      expect(toast.success).toHaveBeenCalledWith('Blueprint created successfully');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
