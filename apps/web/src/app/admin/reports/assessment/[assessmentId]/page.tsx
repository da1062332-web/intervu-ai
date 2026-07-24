'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReportSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';
import { StatCard } from '@/components/ui/stat-card';
import { ChevronLeft, BarChart3, Users, Target, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/services/api/client';

interface AssessmentOutcome {
  assessment: {
    id: string;
    title: string;
  };
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  completionRate: number;
  topicPerformance: { topic: string; averageScore: number }[];
}

export default function AdminAssessmentOutcomePage() {
  const params = useParams();
  const assessmentId = params?.assessmentId as string;
  const router = useRouter();

  const [outcome, setOutcome] = useState<AssessmentOutcome | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOutcome = async () => {
      try {
        const data = await apiClient.request<AssessmentOutcome>(
          `/admin/reports/assessment/${assessmentId}`,
        );
        setOutcome(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (assessmentId) fetchOutcome();
  }, [assessmentId]);

  if (loading) return <ReportSkeleton />;
  if (!outcome) {
    return (
      <EmptyState
        title='Report Not Found'
        description='Could not load the assessment outcome report.'
        actionLabel='Go Back'
        onAction={() => router.back()}
      />
    );
  }

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-8 animate-fade-in-up'>
      <SectionHeader
        title='Assessment Outcome Report'
        description={outcome.assessment.title}
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Reports' }, { label: 'Assessment' }, { label: outcome.assessment.title }]}
        actions={
          <Button variant='outline' onClick={() => router.back()}>
            <ChevronLeft className='w-4 h-4 mr-2' />
            Back
          </Button>
        }
      />

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          title="Average Score"
          value={Math.round(outcome.averageScore)}
          icon={<BarChart3 className="size-5" />}
        />
        <StatCard
          title="Pass Rate"
          value={`${Math.round(outcome.passRate)}%`}
          icon={<Target className="size-5" />}
        />
        <StatCard
          title="Completion Rate"
          value={`${Math.round(outcome.completionRate)}%`}
          icon={<Users className="size-5" />}
        />
        <StatCard
          title="Highest / Lowest"
          value={`${Math.round(outcome.highestScore)} / ${Math.round(outcome.lowestScore)}`}
          icon={<Activity className="size-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Topic Performance</CardTitle>
          <CardDescription>
            Average scores across different topics for this assessment
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {outcome.topicPerformance.length > 0 ? (
            outcome.topicPerformance.map((topic, i) => (
              <div key={i} className='flex flex-col gap-2'>
                <div className='flex justify-between text-sm'>
                  <span className='font-medium'>{topic.topic}</span>
                  <span>{Math.round(topic.averageScore * 10)}%</span>
                </div>
                <Progress value={Math.round(topic.averageScore * 10)} className='h-2' />
              </div>
            ))
          ) : (
            <p className='text-sm text-gray-500'>No topic performance data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
