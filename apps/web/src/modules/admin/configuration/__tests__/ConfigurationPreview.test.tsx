import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigurationPreview } from '../ConfigurationPreview';
import {
  useConfigPreview,
  usePublishConfig,
  useValidateConfig,
  useConfigValidation,
  useConfig,
} from '@/services/exam-configs';
import { useRouter } from 'next/navigation';

vi.mock('@/services/exam-configs', () => ({
  useConfigPreview: vi.fn(),
  usePublishConfig: vi.fn(),
  useValidateConfig: vi.fn(),
  useConfigValidation: vi.fn(),
  useConfig: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

describe('ConfigurationPreview', () => {
  const mockConfigId = 'config-123';
  const mockMutatePublish = vi.fn();
  const mockMutateValidate = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);

    vi.mocked(useConfigPreview).mockReturnValue({
      data: {
        configId: mockConfigId,
        name: 'Test Exam',
        role: 'SDE',
        durationMinutes: 60,
        questions: 10,
        sections: 1,
        difficulty: { easy: 30, medium: 50, hard: 20 },
        sectionBreakdown: [
          { name: 'General', code: 'GEN', questionCount: 10, durationMinutes: 60, topicCount: 2 },
        ],
        isReadyToPublish: true,
      },
      isLoading: false,
    } as any);

    vi.mocked(useConfig).mockReturnValue({
      data: { status: 'DRAFT' },
    } as any);

    vi.mocked(usePublishConfig).mockReturnValue({
      mutateAsync: mockMutatePublish,
      isPending: false,
    } as any);

    vi.mocked(useValidateConfig).mockReturnValue({
      mutateAsync: mockMutateValidate,
      isPending: false,
    } as any);

    vi.mocked(useConfigValidation).mockReturnValue({
      data: null,
    } as any);
  });

  it('renders Topic Summary correctly', () => {
    render(<ConfigurationPreview configId={mockConfigId} />);
    expect(screen.getByText('Topic Coverage')).toBeInTheDocument();
    expect(screen.getByText(/2 topics mapped/i)).toBeInTheDocument();
  });

  it('disables Publish button before validation is run', () => {
    render(<ConfigurationPreview configId={mockConfigId} />);
    const publishBtn = screen.getByRole('button', { name: /Publish Configuration/i });
    expect(publishBtn).toBeDisabled();
    expect(screen.getByText('Run validation before publishing.')).toBeInTheDocument();
  });

  it('disables Publish button after failed validation', () => {
    vi.mocked(useConfigValidation).mockReturnValue({
      data: { valid: false, errors: ['Error 1'], warnings: [] },
    } as any);
    render(<ConfigurationPreview configId={mockConfigId} />);

    expect(screen.getByText('Validation failed')).toBeInTheDocument();
    expect(screen.getByText('Error 1')).toBeInTheDocument();

    const publishBtn = screen.getByRole('button', { name: /Publish Configuration/i });
    expect(publishBtn).toBeDisabled();
  });

  it('enables Publish button after successful validation and opens confirmation dialog', async () => {
    vi.mocked(useConfigValidation).mockReturnValue({
      data: { valid: true, errors: [], warnings: [] },
    } as any);
    render(<ConfigurationPreview configId={mockConfigId} />);

    const publishBtn = screen.getByRole('button', { name: /Publish Configuration/i });
    expect(publishBtn).not.toBeDisabled();

    fireEvent.click(publishBtn);
    expect(screen.getByText('Publish Configuration?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Publish' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockMutatePublish).toHaveBeenCalled();
    });
  });

  it('shows Already Published if config status is PUBLISHED', () => {
    vi.mocked(useConfig).mockReturnValue({
      data: { status: 'PUBLISHED' },
    } as any);
    render(<ConfigurationPreview configId={mockConfigId} />);

    const publishBtn = screen.getByRole('button', { name: /Already Published/i });
    expect(publishBtn).toBeDisabled();
    expect(screen.getByText('Published')).toBeInTheDocument();
  });
});
