import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TemplateListPageClient } from '../app/admin/templates/TemplateListPageClient';
import { useTemplates } from '../services/templates/hooks';

vi.mock('../services/templates/hooks', () => ({
  useTemplates: vi.fn(),
}));

const mockTemplates = [
  {
    id: 'tpl_1',
    name: 'Frontend Developer',
    description: 'A template for React developers',
    isBaseTemplate: true,
    active: true,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl_2',
    name: 'Backend Developer',
    description: 'A template for Node.js developers',
    isBaseTemplate: true,
    active: false,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('TemplateListPageClient', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TemplateListPageClient />
      </QueryClientProvider>,
    );
  };

  it('renders loading skeleton while fetching', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      isFetching: true,
    } as any);

    renderComponent();
    expect(screen.getByPlaceholderText('Search templates...')).toBeInTheDocument();
  });

  it('renders error state when fetch fails', () => {
    const mockRefetch = vi.fn();
    vi.mocked(useTemplates).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
      isFetching: false,
    } as any);

    renderComponent();
    expect(screen.getByText('Error loading templates')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders empty state when no templates exist', () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: { items: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    renderComponent();
    expect(screen.getByText('No templates found')).toBeInTheDocument();
  });

  it('renders template list and handles search', async () => {
    vi.mocked(useTemplates).mockReturnValue({
      data: { items: mockTemplates, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    renderComponent();

    // Verify all templates are rendered
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Backend Developer')).toBeInTheDocument();

    // Verify status badges
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();

    // Search for "frontend"
    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'frontend' } });

    // Wait for the list to filter
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.queryByText('Backend Developer')).not.toBeInTheDocument();
    });
  });
});
