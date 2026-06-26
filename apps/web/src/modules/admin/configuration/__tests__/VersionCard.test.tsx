import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VersionCard } from '../VersionCard';
import type { ConfigVersionEntry } from '@/services/exam-configs/types';

vi.mock('date-fns', async () => {
  const actual = await vi.importActual<typeof import('date-fns')>('date-fns');
  return {
    ...actual,
    formatDistanceToNow: () => '3 hours ago',
    format: () => 'Jun 25, 2026, 12:00 PM',
  };
});

const makeVersion = (n: number, snapshot: Record<string, unknown> = {}): ConfigVersionEntry => ({
  id: `v-id-${n}`,
  configId: 'cfg-1',
  versionNumber: n,
  snapshot,
  createdAt: new Date().toISOString(),
});

describe('VersionCard', () => {
  it('renders version number', () => {
    render(<VersionCard version={makeVersion(3)} />);
    expect(screen.getByText('v3')).toBeInTheDocument();
  });

  it('shows "Latest" badge when isLatest is true', () => {
    render(<VersionCard version={makeVersion(1)} isLatest />);
    expect(screen.getByText('Latest')).toBeInTheDocument();
  });

  it('does NOT show "Latest" badge for non-latest versions', () => {
    render(<VersionCard version={makeVersion(2)} isLatest={false} />);
    expect(screen.queryByText('Latest')).not.toBeInTheDocument();
  });

  it('shows Restore button only for non-latest versions', () => {
    const onRestore = vi.fn();
    render(<VersionCard version={makeVersion(2)} isLatest={false} onRestore={onRestore} />);
    expect(screen.getByRole('button', { name: /Restore/i })).toBeInTheDocument();
  });

  it('does NOT show Restore button on latest version', () => {
    render(<VersionCard version={makeVersion(1)} isLatest onRestore={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /Restore/i })).not.toBeInTheDocument();
  });

  it('calls onRestore with correct versionId when Restore is clicked', () => {
    const onRestore = vi.fn();
    render(<VersionCard version={makeVersion(2)} isLatest={false} onRestore={onRestore} />);
    fireEvent.click(screen.getByRole('button', { name: /Restore/i }));
    expect(onRestore).toHaveBeenCalledWith('v-id-2');
  });

  it('disables Restore button while isRestoring is true', () => {
    render(
      <VersionCard version={makeVersion(2)} isLatest={false} onRestore={vi.fn()} isRestoring />,
    );
    expect(screen.getByRole('button', { name: /Restoring.../i })).toBeDisabled();
  });

  it('shows expand button when onToggleExpand is provided', () => {
    render(<VersionCard version={makeVersion(1)} onToggleExpand={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Expand/i })).toBeInTheDocument();
  });

  it('calls onToggleExpand when expand button is clicked', () => {
    const onToggle = vi.fn();
    render(<VersionCard version={makeVersion(1)} onToggleExpand={onToggle} isExpanded={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Expand/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('renders snapshot details when expanded with examConfig', () => {
    const snapshot = {
      examConfig: { name: 'SDE Exam', role: 'SDE', durationMinutes: 60, totalQuestions: 30 },
      sections: [],
      difficultyDistribution: null,
    };
    render(<VersionCard version={makeVersion(1, snapshot)} isExpanded />);
    expect(screen.getByText('SDE Exam')).toBeInTheDocument();
    expect(screen.getByText('SDE')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders section list in expanded view', () => {
    const snapshot = {
      sections: [
        { name: 'Aptitude', questionCount: 10 },
        { name: 'Coding', questionCount: 20 },
      ],
    };
    render(<VersionCard version={makeVersion(1, snapshot)} isExpanded />);
    expect(screen.getByText('Aptitude')).toBeInTheDocument();
    expect(screen.getByText('10 Q')).toBeInTheDocument();
    expect(screen.getByText('Coding')).toBeInTheDocument();
    expect(screen.getByText('20 Q')).toBeInTheDocument();
  });

  it('renders difficulty breakdown in expanded view', () => {
    const snapshot = {
      difficultyDistribution: { easyPercentage: 30, mediumPercentage: 50, hardPercentage: 20 },
    };
    render(<VersionCard version={makeVersion(1, snapshot)} isExpanded />);
    expect(screen.getByText('Easy 30%')).toBeInTheDocument();
    expect(screen.getByText('Med 50%')).toBeInTheDocument();
    expect(screen.getByText('Hard 20%')).toBeInTheDocument();
  });
});
