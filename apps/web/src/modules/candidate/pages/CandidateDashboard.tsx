'use client';

import { CandidateDashboardHeader } from '@/components/candidate/dashboard/CandidateDashboardHeader';
import { UpcomingTests } from '../components/UpcomingTests';
import { PerformanceSnapshot } from '../components/PerformanceSnapshot';
import { AssessmentStatusPanel } from '../components/AssessmentStatusPanel';
import { AttemptHistoryTable } from '../components/AttemptHistoryTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function CandidateDashboard() {
  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 animate-fade-in-up'>
      <CandidateDashboardHeader />

      <Tabs defaultValue='overview' className='w-full space-y-6'>
        <TabsList className='bg-transparent border-b border-border/60 w-full flex justify-start p-0 h-auto rounded-none space-x-6'>
          <TabsTrigger
            value='overview'
            className='rounded-none px-2 py-3 text-sm font-semibold tracking-wide data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground hover:text-foreground transition-all'
          >
            Overview & Tasks
          </TabsTrigger>
          <TabsTrigger
            value='history'
            className='rounded-none px-2 py-3 text-sm font-semibold tracking-wide data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground hover:text-foreground transition-all'
          >
            History & Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6 pt-2'>
          <PerformanceSnapshot />
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <AssessmentStatusPanel />
            <UpcomingTests />
          </div>
        </TabsContent>

        <TabsContent value='history' className='space-y-6 pt-2'>
          <AttemptHistoryTable showFilters={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
