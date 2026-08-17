'use client';

import { useEffect } from 'react';
import { useTestCatalog } from '../hooks/useTestCatalog';
import { useTestCatalogStore } from '../stores/testCatalog.store';
import { TestFilters } from '../components/TestFilters';
import { TestCardGrid } from '../components/TestCardGrid';
import { EmptyState } from '../components/EmptyState';
import { TestDiscoveryError } from '@/features/candidate/tests/components/TestDiscoveryError';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';

interface TestItem {
  id: string;
  configId?: string;
  title: string;
  company?: string;
  difficulty?: string;
}

export function TestCatalogPage() {
  const {
    searchQuery,
    difficultyFilter,
    currentPage,
    itemsPerPage,
    setSearchQuery,
    setDifficultyFilter,
    setCurrentPage,
    resetFilters,
  } = useTestCatalogStore();

  const queryParams = {
    search: searchQuery || undefined,
    difficulty: difficultyFilter !== 'All' ? difficultyFilter : undefined,
    page: currentPage,
    limit: itemsPerPage,
  };

  const { data: tests, pagination, isLoading, error, refetch } = useTestCatalog(queryParams);

  // Sync hydration for store
  useEffect(() => {
    useTestCatalogStore.persist.rehydrate();
  }, []);

  if (isLoading) {
    return (
      <div className='mx-auto w-full max-w-[1440px] px-6 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-12 space-y-8 animate-fade-in-up'>
        <SectionHeader
          title='Available Assessments'
          description='Find and prepare for your assigned and recommended assessments.'
          breadcrumbs={[
            { label: 'Dashboard', href: '/candidate/dashboard' },
            { label: 'Assessments' },
          ]}
        />
        <Skeleton className='h-40 w-full rounded-xl border border-border/40' />
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2'>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className='h-64 w-full rounded-xl border border-border/40' />
          ))}
        </div>
      </div>
    );
  }

  if (error || !tests) {
    return (
      <TestDiscoveryError
        error={new Error(error || 'Failed to load assessments')}
        reset={refetch}
      />
    );
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleDifficultyChange = (diff: 'All' | 'Easy' | 'Medium' | 'Hard') => {
    setDifficultyFilter(diff);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleReset = () => {
    resetFilters();
  };

  return (
    <div className='mx-auto w-full max-w-[1440px] px-6 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-12 space-y-8 animate-fade-in-up'>
      <SectionHeader
        title='Available Assessments'
        description='Find and prepare for your assigned and recommended assessments.'
        breadcrumbs={[
          { label: 'Dashboard', href: '/candidate/dashboard' },
          { label: 'Assessments' },
        ]}
      />

      <TestFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        difficultyFilter={difficultyFilter}
        onDifficultyChange={handleDifficultyChange}
        totalResults={pagination.total ?? tests.length}
      />

      {tests.length === 0 ? (
        <EmptyState onReset={handleReset} />
      ) : (
        <TestCardGrid
          tests={tests}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          totalItems={pagination.total}
        />
      )}
    </div>
  );
}
