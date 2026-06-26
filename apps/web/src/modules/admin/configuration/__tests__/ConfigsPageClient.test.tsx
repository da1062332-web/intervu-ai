import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigsPageClient } from '@/app/admin/configurations/ConfigsPageClient';
import { useConfigs } from '@/services/exam-configs';

vi.mock('@/services/exam-configs', () => ({
  useConfigs: vi.fn(),
}));

// Minimal config-table mock so we can focus on the dashboard shell
vi.mock('@/components/admin/config/config-table', () => ({
  ConfigTable: ({ configs }: { configs: any[] }) => (
    <div data-testid='config-table'>
      {configs.map((c) => (
        <div key={c.id} data-testid={`config-row-${c.id}`}>
          {c.name}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className: string }) => (
    <div data-testid='skeleton' className={className} />
  ),
}));

const mockConfigs = [
  {
    id: '1',
    name: 'SDE Screen',
    code: 'SDE',
    role: 'Software Engineer',
    durationMinutes: 60,
    totalQuestions: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'QA Evaluation',
    code: 'QA',
    role: 'Quality Assurance',
    durationMinutes: 45,
    totalQuestions: 20,
    isActive: false,
    createdAt: new Date().toISOString(),
  },
];

describe('ConfigsPageClient (Dashboard)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders loading skeletons while fetching', () => {
    vi.mocked(useConfigs).mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      refetch: vi.fn(),
    } as any);
    render(<ConfigsPageClient />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('renders error state with a retry button', () => {
    const mockRefetch = vi.fn();
    vi.mocked(useConfigs).mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch: mockRefetch,
    } as any);
    render(<ConfigsPageClient />);
    expect(screen.getByText('Error loading configurations')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
    expect(mockRefetch).toHaveBeenCalledOnce();
  });

  it('renders all configurations when data is available', () => {
    vi.mocked(useConfigs).mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockConfigs,
      refetch: vi.fn(),
    } as any);
    render(<ConfigsPageClient />);
    expect(screen.getByTestId('config-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('config-row-2')).toBeInTheDocument();
  });

  it('renders empty table when no configs exist', () => {
    vi.mocked(useConfigs).mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
      refetch: vi.fn(),
    } as any);
    render(<ConfigsPageClient />);
    const table = screen.getByTestId('config-table');
    expect(table).toBeEmptyDOMElement();
  });

  it('filters configs by name using search box', () => {
    vi.mocked(useConfigs).mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockConfigs,
      refetch: vi.fn(),
    } as any);
    render(<ConfigsPageClient />);

    const searchInput = screen.getByPlaceholderText(/Search configurations/i);
    fireEvent.change(searchInput, { target: { value: 'SDE' } });

    expect(screen.getByTestId('config-row-1')).toBeInTheDocument();
    expect(screen.queryByTestId('config-row-2')).not.toBeInTheDocument();
  });

  it('filters configs by role using search box', () => {
    vi.mocked(useConfigs).mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockConfigs,
      refetch: vi.fn(),
    } as any);
    render(<ConfigsPageClient />);

    const searchInput = screen.getByPlaceholderText(/Search configurations/i);
    fireEvent.change(searchInput, { target: { value: 'quality assurance' } });

    expect(screen.queryByTestId('config-row-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('config-row-2')).toBeInTheDocument();
  });

  it('returns all configs when search box is cleared', () => {
    vi.mocked(useConfigs).mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockConfigs,
      refetch: vi.fn(),
    } as any);
    render(<ConfigsPageClient />);

    const searchInput = screen.getByPlaceholderText(/Search configurations/i);
    fireEvent.change(searchInput, { target: { value: 'SDE' } });
    fireEvent.change(searchInput, { target: { value: '' } });

    expect(screen.getByTestId('config-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('config-row-2')).toBeInTheDocument();
  });
});
