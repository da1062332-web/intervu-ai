'use client';

import * as React from 'react';
import { Users } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { useCandidates } from '@/features/admin/candidates/hooks/useCandidates';
import { CandidateSearch } from '@/features/admin/candidates/components/CandidateSearch';
import { CandidateFilters } from '@/features/admin/candidates/components/CandidateFilters';
import { CandidateTable } from '@/features/admin/candidates/components/CandidateTable';
import { CandidateEmptyState } from '@/features/admin/candidates/components/CandidateEmptyState';
import { CandidateOverviewCard } from '@/features/admin/candidates/components/CandidateOverviewCard';
import { DEFAULT_PAGE_SIZE } from '@/features/admin/candidates/constants';

export default function AdminCandidatesPage() {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [sortBy, setSortBy] = React.useState('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(1);

  const { data, isLoading, isRefetching, error, refetch } = useCandidates({
    page,
    limit: DEFAULT_PAGE_SIZE,
    search: search.trim() || undefined,
    status: status || undefined,
    sortBy,
    sortOrder,
  });

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const isFilterOrSearchActive = Boolean(search || status || sortBy !== 'createdAt' || sortOrder !== 'desc');
  const candidates = data?.items ?? [];
  const pagination = data?.pagination;

  const totalCandidates = pagination?.total ?? 0;
  const activeCount = candidates.filter((c) => c.status === 'ACTIVE').length;
  const inactiveCount = candidates.filter((c) => c.status !== 'ACTIVE').length;

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6">
      <SectionHeader
        title="Candidate Management"
        description="Monitor candidate activity, view assessment performance metrics, and manage enrolled accounts."
        icon={Users}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Execution & Review' },
          { label: 'Candidates' },
        ]}
      />

      <CandidateOverviewCard
        total={totalCandidates}
        activeCount={status === 'ACTIVE' ? totalCandidates : activeCount}
        inactiveCount={status === 'INACTIVE' ? totalCandidates : inactiveCount}
        isLoading={isLoading && !isRefetching}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-xs">
        <CandidateSearch
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by candidate name or email..."
        />
        <CandidateFilters
          status={status}
          onStatusChange={handleStatusChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onRefresh={refetch}
          isRefetching={isRefetching}
        />
      </div>

      {error ? (
        <CandidateEmptyState
          error={error}
          onRetry={refetch}
        />
      ) : !isLoading && candidates.length === 0 ? (
        <CandidateEmptyState
          isSearchOrFilterActive={isFilterOrSearchActive}
          onResetFilters={handleResetFilters}
        />
      ) : (
        <CandidateTable
          candidates={candidates}
          pagination={pagination}
          onPageChange={(newPage) => setPage(newPage)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
