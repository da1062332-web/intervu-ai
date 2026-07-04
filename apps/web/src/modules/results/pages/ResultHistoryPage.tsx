'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCandidateResults } from '../hooks/results.hooks';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText, Calendar, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ResultHistoryPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const navigate = router.push;
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useCandidateResults(user?.id || '', page, 10);

  if (isLoading) return <Loading />;

  if (isError || !data || data.data.length === 0) {
    return (
      <EmptyState
        title='No Results Found'
        description="You haven't completed any assessments yet."
      />
    );
  }

  return (
    <div className='container mx-auto p-4 md:p-6 lg:p-8 space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight text-gray-900'>Assessment History</h1>
        <p className='text-sm text-gray-500'>
          View and track all your previous assessment results.
        </p>
      </div>

      <div className='space-y-4'>
        {data.data.map((result) => (
          <Card key={result.id} className='hover:shadow-md transition-shadow'>
            <CardContent className='p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
              <div className='flex items-start gap-4 flex-1'>
                <div className='bg-blue-50 p-3 rounded-xl hidden sm:block'>
                  <FileText className='text-blue-600 w-6 h-6' />
                </div>
                <div>
                  <h3 className='font-semibold text-lg text-gray-900'>{result.assessmentName}</h3>
                  <div className='flex items-center gap-4 mt-2 text-sm text-gray-500'>
                    <div className='flex items-center gap-1'>
                      <Calendar className='w-4 h-4' />
                      {new Date(result.createdAt).toLocaleDateString()}
                    </div>
                    <div className='flex items-center gap-1'>
                      <TrendingUp className='w-4 h-4' />
                      Score: {result.score}
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end'>
                <Badge
                  variant={
                    result.percentage >= 70
                      ? 'default'
                      : result.percentage >= 40
                        ? 'secondary'
                        : 'destructive'
                  }
                  className={`text-sm px-3 py-1 ${result.percentage >= 70 ? 'bg-green-100 text-green-800 hover:bg-green-200 border-transparent' : result.percentage >= 40 ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-transparent' : ''}`}
                >
                  {result.percentage}%
                </Badge>
                <Button onClick={() => navigate(`/results/${result.attemptId}`)}>
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.meta.totalPages > 1 && (
        <div className='flex justify-center gap-2 mt-8'>
          <Button
            variant='outline'
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className='flex items-center px-4 text-sm font-medium text-gray-700'>
            Page {page} of {data.meta.totalPages}
          </span>
          <Button
            variant='outline'
            disabled={page === data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
