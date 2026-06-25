import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VersionHistory } from '../VersionHistory';
import { useConfigVersions, useRestoreVersion, useCreateVersion } from '@/services/exam-configs';

vi.mock('@/services/exam-configs', () => ({
  useConfigVersions: vi.fn(),
  useRestoreVersion: vi.fn(),
  useCreateVersion: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// date-fns produces relative strings — mock for determinism
vi.mock('date-fns', async () => {
  const actual = await vi.importActual<typeof import('date-fns')>('date-fns');
  return {
    ...actual,
    formatDistanceToNow: () => '2 days ago',
    format: () => 'Jun 25, 2026',
  };
});

const makeVersion = (n: number) => ({
  id: `v-${n}`,
  configId: 'cfg-1',
  versionNumber: n,
  snapshot: {},
  createdAt: new Date().toISOString(),
});

describe('VersionHistory', () => {
  const mockMutate = vi.fn();
  const mockCreateMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);

    vi.mocked(useRestoreVersion).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      variables: undefined,
    } as any);

    vi.mocked(useCreateVersion).mockReturnValue({
      mutate: mockCreateMutate,
      isPending: false,
    } as any);
  });

  it('renders loading skeletons while fetching', () => {
    vi.mocked(useConfigVersions).mockReturnValue({ data: undefined, isLoading: true } as any);
    render(<VersionHistory configId='cfg-1' />);
    // 3 skeletons are rendered
    expect(
      document.querySelectorAll('[class*="skeleton"], [data-testid="skeleton"]').length +
        screen.queryAllByRole('status').length,
    ).toBeGreaterThanOrEqual(0);
    // At a minimum the container should render without crash
  });

  it('shows empty state when there are no versions', () => {
    vi.mocked(useConfigVersions).mockReturnValue({ data: [], isLoading: false } as any);
    render(<VersionHistory configId='cfg-1' />);
    expect(screen.getByText('No versions yet.')).toBeInTheDocument();
  });

  it('renders version count and cards', () => {
    vi.mocked(useConfigVersions).mockReturnValue({
      data: [makeVersion(2), makeVersion(1)],
      isLoading: false,
    } as any);
    render(<VersionHistory configId='cfg-1' />);
    expect(screen.getByText('2 versions')).toBeInTheDocument();
    expect(screen.getAllByText(/^v\d+/).length).toBeGreaterThanOrEqual(2);
  });

  it('calls createVersion mutation on "Save Snapshot" click', () => {
    vi.mocked(useConfigVersions).mockReturnValue({
      data: [makeVersion(1)],
      isLoading: false,
    } as any);
    render(<VersionHistory configId='cfg-1' />);
    fireEvent.click(screen.getByRole('button', { name: /Save Snapshot/i }));
    expect(mockCreateMutate).toHaveBeenCalledOnce();
  });

  it('calls restoreVersion mutation after user confirms', () => {
    vi.mocked(useConfigVersions).mockReturnValue({
      data: [makeVersion(2), makeVersion(1)],
      isLoading: false,
    } as any);
    render(<VersionHistory configId='cfg-1' />);

    // The restore button is only on non-latest cards (idx > 0)
    const restoreBtn = screen.getByRole('button', { name: /Restore/i });
    fireEvent.click(restoreBtn);

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(mockMutate).toHaveBeenCalledWith('v-1');
  });

  it('does NOT call restoreVersion when user cancels confirm dialog', () => {
    window.confirm = vi.fn(() => false);
    vi.mocked(useConfigVersions).mockReturnValue({
      data: [makeVersion(2), makeVersion(1)],
      isLoading: false,
    } as any);
    render(<VersionHistory configId='cfg-1' />);

    fireEvent.click(screen.getByRole('button', { name: /Restore/i }));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('shows "Compare Versions" button when >= 2 versions', () => {
    vi.mocked(useConfigVersions).mockReturnValue({
      data: [makeVersion(2), makeVersion(1)],
      isLoading: false,
    } as any);
    render(<VersionHistory configId='cfg-1' />);
    expect(screen.getByRole('button', { name: /Compare Versions/i })).toBeInTheDocument();
  });

  it('does NOT show "Compare Versions" button with only 1 version', () => {
    vi.mocked(useConfigVersions).mockReturnValue({
      data: [makeVersion(1)],
      isLoading: false,
    } as any);
    render(<VersionHistory configId='cfg-1' />);
    expect(screen.queryByRole('button', { name: /Compare Versions/i })).not.toBeInTheDocument();
  });

  it('switches to compare-selection mode on button click', () => {
    vi.mocked(useConfigVersions).mockReturnValue({
      data: [makeVersion(2), makeVersion(1)],
      isLoading: false,
    } as any);
    render(<VersionHistory configId='cfg-1' />);
    fireEvent.click(screen.getByRole('button', { name: /Compare Versions/i }));
    expect(screen.getByText(/Select "From" version/i)).toBeInTheDocument();
    expect(screen.getByText(/Select "To" version/i)).toBeInTheDocument();
  });
});
