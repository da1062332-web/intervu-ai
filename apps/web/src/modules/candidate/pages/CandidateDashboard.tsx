'use client';

import { CandidateDashboardHeader } from '@/components/candidate/dashboard/CandidateDashboardHeader';

import { UpcomingTests } from '../components/UpcomingTests';
import { PerformanceSnapshot } from '../components/PerformanceSnapshot';
import { AssessmentStatusPanel } from '../components/AssessmentStatusPanel';
import { AttemptHistoryTable } from '../components/AttemptHistoryTable';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CandidateDashboard() {
  return (
    <div className='space-y-8 animate-fade-in-up pb-8'>
      <CandidateDashboardHeader />

      <Tabs defaultValue='overview' className='w-full space-y-8'>
        <TabsList className='bg-muted/50 p-1 rounded-xl'>
          <TabsTrigger value='overview' className='rounded-lg px-6'>Overview</TabsTrigger>
          <TabsTrigger value='history' className='rounded-lg px-6'>History & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-8'>
          <PerformanceSnapshot />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <AssessmentStatusPanel />
            <UpcomingTests />
          </div>
        </TabsContent>

        <TabsContent value='history' className='space-y-8'>
          <AttemptHistoryTable showFilters={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
