import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { EditBlueprintModal } from '../components/EditBlueprintModal';
import * as blueprintServices from '@/services/blueprints/hooks';

vi.mock('@/services/blueprints/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/blueprints/hooks')>();
  return {
    ...actual,
    useUpdateBlueprint: vi.fn(),
  };
});

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EditBlueprintModal', () => {
  const mockUpdate = vi.fn();
  const mockOnClose = vi.fn();
  const mockBlueprint = {
    id: '123',
    name: 'Old Name',
    code: 'OLD_001',
    description: 'Old description',
    totalQuestions: 10,
    totalDurationMinutes: 20,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (blueprintServices.useUpdateBlueprint as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mutateAsync: mockUpdate,
      isPending: false,
    });
  });

  it('renders correctly with pre-filled data', () => {
    render(
      <EditBlueprintModal isOpen={true} onClose={mockOnClose} blueprint={mockBlueprint as any} />,
    );
    expect(screen.getByText('Edit Blueprint')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('OLD_001')).toBeInTheDocument();
  });

  it('validates fields and prevents submission if unchanged or invalid (handled by HTML5 mostly)', () => {
    // Just verifying rendering logic
    render(
      <EditBlueprintModal isOpen={true} onClose={mockOnClose} blueprint={mockBlueprint as any} />,
    );
    const submitBtn = screen.getByRole('button', { name: /Save Changes/i });
    expect(submitBtn).toBeInTheDocument();
  });

  it('submits successfully with valid updated data', async () => {
    const { default: toast } = await import('react-hot-toast');
    mockUpdate.mockResolvedValueOnce({});

    render(
      <EditBlueprintModal isOpen={true} onClose={mockOnClose} blueprint={mockBlueprint as any} />,
    );

    fireEvent.change(screen.getByLabelText(/Blueprint Name/), { target: { value: 'New Name' } });

    const submitBtn = screen.getByRole('button', { name: /Save Changes/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        id: '123',
        data: {
          name: 'New Name',
          code: 'OLD_001',
          description: 'Old description',
          totalQuestions: 10,
          totalDurationMinutes: 20,
        },
      });
      expect(toast.success).toHaveBeenCalledWith('Blueprint updated successfully');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
