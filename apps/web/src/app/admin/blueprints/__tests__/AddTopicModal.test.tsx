import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AddTopicModal } from '../components/AddTopicModal';
import * as blueprintServices from '@/services/blueprints/hooks';
import * as examSectionsHooks from '@/services/exam-sections/hooks';
import * as topicSectionQueries from '@/features/topic-section-mapping/api/queries';

vi.mock('@/services/blueprints/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/blueprints/hooks')>();
  return {
    ...actual,
    useAddBlueprintTopic: vi.fn(),
  };
});

vi.mock('@/services/exam-sections/hooks', () => ({
  useSections: vi.fn(),
}));

vi.mock('@/features/topic-section-mapping/api/queries', () => ({
  useAdminTopics: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: [] }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AddTopicModal', () => {
  const mockAddTopic = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (blueprintServices.useAddBlueprintTopic as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      {
        mutateAsync: mockAddTopic,
        isPending: false,
      },
    );

    (examSectionsHooks.useSections as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [{ id: 'sec1', name: 'Frontend', code: 'FE' }],
    });

    (topicSectionQueries.useAdminTopics as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [{ id: 'top1', domain: 'React', topicName: 'Hooks' }],
    });
  });

  it('renders correctly', () => {
    render(<AddTopicModal isOpen={true} onClose={mockOnClose} blueprintId='bp1' />);
    expect(screen.getByText('Add Topic Configuration')).toBeInTheDocument();
  });

  it('validates difficulty sum', () => {
    render(<AddTopicModal isOpen={true} onClose={mockOnClose} blueprintId='bp1' />);

    const easyInput = screen.getByLabelText(/Easy \*/i);
    fireEvent.change(easyInput, { target: { value: '10' } });

    // The default total questions is 10. Easy=10, Medium=4, Hard=3 => Sum is 17 != 10
    expect(screen.getByText('Must equal total questions.')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Add Topic/i });
    expect(submitBtn).toBeDisabled();
  });

  it('submits successfully with valid difficulty distribution', async () => {
    const { default: toast } = await import('react-hot-toast');
    mockAddTopic.mockResolvedValueOnce({});

    render(<AddTopicModal isOpen={true} onClose={mockOnClose} blueprintId='bp1' />);

    // Select section & topic
    fireEvent.change(screen.getByLabelText(/Select Section \*/i), { target: { value: 'sec1' } });
    fireEvent.change(screen.getByLabelText(/Select Topic \*/i), { target: { value: 'top1' } });

    // Ensure sum equals 10
    fireEvent.change(screen.getByLabelText(/Easy \*/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Medium \*/i), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/Hard \*/i), { target: { value: '2' } });

    const submitBtn = screen.getByRole('button', { name: /Add Topic/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAddTopic).toHaveBeenCalledWith({
        id: 'bp1',
        data: {
          sectionId: 'sec1',
          topicId: 'top1',
          questionCount: 10,
          weightage: 25,
          easyCount: 5,
          mediumCount: 3,
          hardCount: 2,
        },
      });
      expect(toast.success).toHaveBeenCalledWith('Topic added successfully');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
