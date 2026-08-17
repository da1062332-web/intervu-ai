'use client';

import { TestConfig } from '@/features/candidate/tests/types/test.types';
import { TestCard } from './TestCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TestCardGridProps {
  tests: TestConfig[];
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
}

export function TestCardGrid({
  tests,
  currentPage,
  itemsPerPage,
  onPageChange,
  totalItems,
}: TestCardGridProps) {
  const actualTotal = totalItems ?? tests.length;
  const totalPages = Math.ceil(actualTotal / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // If totalItems is provided, assume tests is already paginated by the server.
  // Otherwise, fallback to client-side pagination.
  const paginatedTests = totalItems !== undefined ? tests : tests.slice(startIndex, endIndex);

  if (tests.length === 0) {
    return null;
  }

  return (
    <div className='space-y-8'>
      {/* Cards Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {paginatedTests.map((test, idx) => (
          <TestCard
            key={`${test.id || (test as any).configId || 'test'}-${idx}`}
            test={test}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between border-t border-border/60 pt-6 mt-8'>
          <div className='text-sm text-muted-foreground font-medium'>
            Showing <span className='text-foreground font-semibold'>{startIndex + 1}</span> to{' '}
            <span className='text-foreground font-semibold'>{Math.min(endIndex, actualTotal)}</span>{' '}
            of <span className='text-foreground font-semibold'>{actualTotal}</span> assessments
          </div>
          <div className='flex items-center gap-1.5'>
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
              if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - currentPage) <= 1) {
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
                  <span
                    key={`ellipsis-${pageNum}`}
                    className='px-2 text-muted-foreground/60 text-sm font-semibold select-none'
                  >
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
