'use client';

import { Test } from '../types/Test';
import { TestCard } from './TestCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TestCardGridProps {
  tests: Test[];
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function TestCardGrid({
  tests,
  bookmarkedIds,
  onToggleBookmark,
  currentPage,
  itemsPerPage,
  onPageChange,
}: TestCardGridProps) {
  const totalPages = Math.ceil(tests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTests = tests.slice(startIndex, endIndex);

  if (tests.length === 0) {
    return null;
  }

  return (
    <div className='space-y-8'>
      {/* Cards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {paginatedTests.map((test) => (
          <TestCard
            key={test.id}
            test={test}
            isBookmarked={bookmarkedIds.includes(test.id)}
            onToggleBookmark={() => onToggleBookmark(test.id)}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between border-t border-border/40 pt-6 mt-8'>
          <div className='text-sm text-muted-foreground font-medium'>
            Showing <span className='text-foreground font-semibold'>{startIndex + 1}</span> to{' '}
            <span className='text-foreground font-semibold'>
              {Math.min(endIndex, tests.length)}
            </span>{' '}
            of <span className='text-foreground font-semibold'>{tests.length}</span> assessments
          </div>
          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className='size-9 transition-colors'
              aria-label='Go to previous page'
            >
              <ChevronLeft className='size-4' />
            </Button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              // Show pages close to the current page to avoid clutter
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                Math.abs(pageNum - currentPage) <= 1
              ) {
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => onPageChange(pageNum)}
                    className='size-9 font-semibold transition-all'
                  >
                    {pageNum}
                  </Button>
                );
              }
              if (
                (pageNum === 2 && currentPage > 3) ||
                (pageNum === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return (
                  <span key={pageNum} className='px-1.5 text-muted-foreground/60 text-sm font-semibold select-none'>
                    ...
                  </span>
                );
              }
              return null;
            })}

            <Button
              variant='outline'
              size='icon'
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className='size-9 transition-colors'
              aria-label='Go to next page'
            >
              <ChevronRight className='size-4' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
