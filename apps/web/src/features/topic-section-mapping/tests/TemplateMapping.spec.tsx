import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TemplateMappingModal } from '../../admin/configs/components/concept-mapping/TemplateMappingModal';
import { conceptMappingApi } from '@/services/concept-mapping/api';
import { useTemplates } from '@/services/templates/hooks';
import { vi } from 'vitest';

vi.mock('@/services/concept-mapping/api', () => ({
  conceptMappingApi: {
    assignTemplates: vi.fn(),
  },
}));

vi.mock('@/services/templates/hooks', () => ({
  useTemplates: vi.fn(),
}));

describe('TemplateMappingModal', () => {
  let queryClient: QueryClient;
  const mockConcept = { id: 'c1', topicId: 't1', conceptName: 'Concept A', conceptCode: 'C_A' };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it('renders correctly and searches templates', async () => {
    (useTemplates as any).mockReturnValue({
      data: { data: [{ id: 'tpl1', name: 'Template 1', templateKey: 'T1' }] },
      isLoading: false,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <TemplateMappingModal isOpen={true} onClose={() => {}} concept={mockConcept as any} />
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Assign Templates to Concept A/i)).toBeInTheDocument();
    expect(screen.getByText('Template 1')).toBeInTheDocument();
  });

  it('assigns templates correctly on save', async () => {
    (useTemplates as any).mockReturnValue({
      data: { data: [{ id: 'tpl1', name: 'Template 1', templateKey: 'T1' }] },
      isLoading: false,
    });
    (conceptMappingApi.assignTemplates as any).mockResolvedValueOnce();

    render(
      <QueryClientProvider client={queryClient}>
        <TemplateMappingModal isOpen={true} onClose={() => {}} concept={mockConcept as any} />
      </QueryClientProvider>,
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const saveButton = screen.getByRole('button', { name: /Assign 1 Template/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(conceptMappingApi.assignTemplates).toHaveBeenCalledWith('c1', ['tpl1']);
    });
  });
});
