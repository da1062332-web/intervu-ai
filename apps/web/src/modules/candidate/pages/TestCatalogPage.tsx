'use client';

import { useEffect } from 'react';
import { useTestCatalog } from '../hooks/useTestCatalog';
import { useTestCatalogStore } from '../stores/testCatalog.store';
import { TestFilters } from '../components/TestFilters';
import { TestCardGrid } from '../components/TestCardGrid';
import { EmptyState } from '../components/EmptyState';
import { TestDiscoveryError } from '@/features/candidate/tests/components/TestDiscoveryError';
import { Layers } from 'lucide-react';

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
      <div className='space-y-8 animate-fade-in-up'>
        <div className='flex items-center gap-3'>
          <Layers className='size-8 text-primary' />
          <h1 className='text-3xl font-heading font-bold tracking-tight text-foreground'>
            Available Assessments
          </h1>
        </div>
        <div className='h-32 w-full bg-muted/30 rounded-2xl animate-pulse' />
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='h-60 bg-muted/30 rounded-2xl animate-pulse' />
          <div className='h-60 bg-muted/30 rounded-2xl animate-pulse' />
          <div className='h-60 bg-muted/30 rounded-2xl animate-pulse' />
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

  const handleReset = () => {
    resetFilters();
  };

  return (
    <div className='space-y-8 animate-fade-in-up'>
      <div className='flex items-center gap-3'>
        <Layers className='size-8 text-primary' />
        <div>
          <h1 className='text-3xl font-heading font-bold tracking-tight text-foreground'>
            Available Assessments
          </h1>
          <p className='text-muted-foreground mt-1'>
            Find and prepare for your assigned and recommended tests
          </p>
        </div>
      </div>

      <TestFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        difficultyFilter={difficultyFilter}
        onDifficultyChange={setDifficultyFilter}
        showOnlyBookmarked={showOnlyBookmarked}
        onShowOnlyBookmarkedChange={setShowOnlyBookmarked}
        totalResults={pagination.total}
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
        />
      )}
    </div>
  );
}
