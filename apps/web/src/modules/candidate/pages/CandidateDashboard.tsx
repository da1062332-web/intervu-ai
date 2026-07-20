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
        <TabsList className='bg-transparent border-b border-border w-full flex justify-start p-0 h-auto rounded-none space-x-8'>
          <TabsTrigger value='overview' className='rounded-none px-0 py-3 text-[15px] data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground hover:text-foreground transition-colors' style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 500 }}>
            Overview
          </TabsTrigger>
          <TabsTrigger value='history' className='rounded-none px-0 py-3 text-[15px] data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground hover:text-foreground transition-colors' style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 500 }}>
            History & Reports
          </TabsTrigger>
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
