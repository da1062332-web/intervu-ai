import React, { useEffect, useState } from 'react';
import { useWorkflowDetails } from '../hooks/useWorkflow';
import { WorkflowTimeline } from './WorkflowTimeline';
import { WorkflowActions } from './WorkflowActions';
import { GenerationPanel } from './GenerationPanel';
import { ReviewPanel } from './ReviewPanel';
import { AssemblyPanel } from './AssemblyPanel';
import { PublishingPanel } from './PublishingPanel';
import { WorkflowHistory } from './WorkflowHistory';
import { OverviewPanel } from './OverviewPanel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, LayoutList, Cog, Search, FileText, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WORKFLOW_STATUS_COLORS } from '../constants';

interface WorkflowDetailProps {
  examId: string;
}

export const WorkflowDetail: React.FC<WorkflowDetailProps> = ({ examId }) => {
  const {
    details,
    loading,
    error,
    fetchDetails,
    advanceWorkflow,
    publishWorkflow,
    startGeneration,
    startAssembly,
    rollbackWorkflow,
    retryWorkflow,
  } = useWorkflowDetails(examId);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'generation' | 'review' | 'assembly' | 'publishing' | 'history'
  >('overview');

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  if (loading && !details) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className='rounded-lg bg-red-50 p-4 text-red-800'>
        <p className='font-medium'>Failed to load workflow details</p>
        <p className='mt-1 text-sm'>{error}</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutList },
    { id: 'generation', label: 'Generation', icon: Cog },
    { id: 'review', label: 'Review', icon: Search },
    { id: 'assembly', label: 'Assembly', icon: FileText },
    { id: 'publishing', label: 'Publishing', icon: CheckCircle },
    { id: 'history', label: 'History', icon: Clock },
  ] as const;

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Workflow Command Center</h2>
          <p className='text-muted-foreground text-sm mt-1'>Exam ID: {examId}</p>
        </div>
        <Badge className={WORKFLOW_STATUS_COLORS[details.status]}>
          {details.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className='flex flex-col md:flex-row gap-6'>
        {/* Left Column: Timeline & Actions */}
        <div className='w-full md:w-80 flex-shrink-0 flex flex-col gap-6'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg'>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowTimeline details={details} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg'>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowActions
                details={details}
                onAdvance={advanceWorkflow}
                onRollback={rollbackWorkflow}
                onRetry={retryWorkflow}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabs */}
        <div className='flex-1 flex flex-col min-w-0'>
          <div className='flex overflow-x-auto border-b mb-6 no-scrollbar'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
              >
                <tab.icon className='h-4 w-4' />
                {tab.label}
              </button>
            ))}
          </div>

          <div className='bg-card rounded-lg border shadow-sm p-6 min-h-[500px]'>
            {activeTab === 'overview' && <OverviewPanel examId={examId} />}
            {activeTab === 'generation' && (
              <GenerationPanel
                status={details.questionGeneration}
                onGenerate={async () => {
                  try {
                    await startGeneration();
                  } catch (e: any) {
                    alert(e.message);
                  }
                }}
              />
            )}
            {activeTab === 'review' && (
              <ReviewPanel
                examId={examId}
                status={details.questionReview}
                onReview={() => advanceWorkflow()}
              />
            )}
            {activeTab === 'assembly' && (
              <AssemblyPanel
                status={details.assembly}
                onAssemble={async () => {
                  try {
                    await startAssembly();
                  } catch (e: any) {
                    alert(e.message);
                  }
                }}
              />
            )}
            {activeTab === 'publishing' && (
              <PublishingPanel
                status={details.publishing}
                onPublish={async () => {
                  try {
                    await publishWorkflow();
                  } catch (e: any) {
                    alert(e.message);
                  }
                }}
              />
            )}
            {activeTab === 'history' && <WorkflowHistory history={details.history || []} />}
          </div>
        </div>
      </div>
    </div>
  );
};
