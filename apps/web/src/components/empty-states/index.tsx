import { EmptyStateCard } from '@/components/ui/empty-state';
import { Database, FileQuestion, BarChart, Inbox } from 'lucide-react';
import React from 'react';

export function NoQuestionsFound() {
  return (
    <EmptyStateCard
      title='No questions found'
      description='There are no questions available in this view.'
      icon={<FileQuestion className='size-6 text-muted-foreground' />}
    />
  );
}

export function NoResultsFound() {
  return (
    <EmptyStateCard
      title='No results found'
      description='No evaluation results are available for this candidate or test.'
      icon={<Inbox className='size-6 text-muted-foreground' />}
    />
  );
}

export function NoAssessmentsFound() {
  return (
    <EmptyStateCard
      title='No assessments found'
      description='There are no assessments assigned or created yet.'
      icon={<Database className='size-6 text-muted-foreground' />}
    />
  );
}

export function NoAnalyticsData() {
  return (
    <EmptyStateCard
      title='No analytics data'
      description='Not enough data is available yet to generate analytics.'
      icon={<BarChart className='size-6 text-muted-foreground' />}
    />
  );
}
