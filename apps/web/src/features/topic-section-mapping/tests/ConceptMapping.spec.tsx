import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConceptManagementPanel } from '../../admin/configs/components/concept-mapping/ConceptManagementPanel';
import { conceptMappingApi } from '@/services/concept-mapping/api';
import { vi } from 'vitest';

vi.mock('@/services/concept-mapping/api', () => ({
  conceptMappingApi: {
    getConcepts: vi.fn(),
    createConcept: vi.fn(),
    updateConcept: vi.fn(),
    deactivateConcept: vi.fn(),
  },
}));

describe('ConceptMapping', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it('loads and displays concepts for a topic', async () => {
    (conceptMappingApi.getConcepts as any).mockResolvedValueOnce([
      { id: '1', topicId: 't1', conceptName: 'Concept A', conceptCode: 'C_A', status: 'ACTIVE' },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <ConceptManagementPanel />
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Test Topic/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Concept A')).toBeInTheDocument();
    });
  });

  it('shows empty state when no concepts exist', async () => {
    (conceptMappingApi.getConcepts as any).mockResolvedValueOnce([]);

    render(
      <QueryClientProvider client={queryClient}>
        <ConceptManagementPanel />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/No concepts found/i)).toBeInTheDocument();
    });
  });
});
