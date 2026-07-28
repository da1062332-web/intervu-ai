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
    bookmarkedIds,
    currentPage,
    itemsPerPage,
    showOnlyBookmarked,
    setSearchQuery,
    setDifficultyFilter,
    setShowOnlyBookmarked,
    toggleBookmark,
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
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 animate-fade-in-up'>
        <SectionHeader
          title='Available Assessments'
          description='Find and prepare for your assigned and recommended assessments.'
          breadcrumbs={[{ label: 'Dashboard', href: '/candidate/dashboard' }, { label: 'Assessments' }]}
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

  // Bookmark filtering is still client-side since bookmarks are local in this MVP
  const filteredTests = tests.filter((test: TestItem) => {
    const matchesBookmark = !showOnlyBookmarked || bookmarkedIds.includes(test.configId || test.id);
    return matchesBookmark;
  });

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleDifficultyChange = (diff: 'All' | 'Easy' | 'Medium' | 'Hard') => {
    setDifficultyFilter(diff);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleBookmarkFilterChange = (val: boolean) => {
    setShowOnlyBookmarked(val);
    if (currentPage !== 1) setCurrentPage(1);
  };

  const handleReset = () => {
    resetFilters();
  };

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 animate-fade-in-up'>
      <SectionHeader
        title='Available Assessments'
        description='Find and prepare for your assigned and recommended assessments.'
        breadcrumbs={[{ label: 'Dashboard', href: '/candidate/dashboard' }, { label: 'Assessments' }]}
      />

      <TestFilters
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        difficultyFilter={difficultyFilter}
        onDifficultyChange={handleDifficultyChange}
        showOnlyBookmarked={showOnlyBookmarked}
        onShowOnlyBookmarkedChange={handleBookmarkFilterChange}
        totalResults={showOnlyBookmarked ? filteredTests.length : (pagination.total ?? filteredTests.length)}
      />

      {filteredTests.length === 0 ? (
        <EmptyState onReset={handleReset} />
      ) : (
        <TestCardGrid
          tests={filteredTests}
          bookmarkedIds={bookmarkedIds}
          onToggleBookmark={toggleBookmark}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          totalItems={showOnlyBookmarked ? undefined : pagination.total}
        />
      )}
    </div>
  );
}

