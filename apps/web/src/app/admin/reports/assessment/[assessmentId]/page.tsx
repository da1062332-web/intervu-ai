'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { ChevronLeft, BarChart3, Users, Target, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/v1/admin/reports/assessment/${assessmentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setOutcome(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (assessmentId) fetchOutcome();
  }, [assessmentId]);

  if (loading) return <Loading />;
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
    <div className='container mx-auto p-4 md:p-6 lg:p-8 space-y-8'>
      <div className='flex items-center gap-4 border-b pb-4'>
        <Button variant='ghost' size='icon' onClick={() => router.back()}>
          <ChevronLeft className='w-5 h-5' />
        </Button>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900'>
            Assessment Outcome Report
          </h1>
          <p className='text-sm text-gray-500'>{outcome.assessment.title}</p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-6 flex items-center gap-4'>
            <div className='bg-indigo-100 p-3 rounded-xl text-indigo-600'>
              <BarChart3 className='size-6' />
            </div>
            <div>
              <p className='text-sm text-gray-500 font-medium'>Average Score</p>
              <h3 className='text-2xl font-bold'>{Math.round(outcome.averageScore)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6 flex items-center gap-4'>
            <div className='bg-green-100 p-3 rounded-xl text-green-600'>
              <Target className='size-6' />
            </div>
            <div>
              <p className='text-sm text-gray-500 font-medium'>Pass Rate</p>
              <h3 className='text-2xl font-bold'>{Math.round(outcome.passRate)}%</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6 flex items-center gap-4'>
            <div className='bg-blue-100 p-3 rounded-xl text-blue-600'>
              <Users className='size-6' />
            </div>
            <div>
              <p className='text-sm text-gray-500 font-medium'>Completion Rate</p>
              <h3 className='text-2xl font-bold'>{Math.round(outcome.completionRate)}%</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6 flex items-center gap-4'>
            <div className='bg-purple-100 p-3 rounded-xl text-purple-600'>
              <Activity className='size-6' />
            </div>
            <div>
              <p className='text-sm text-gray-500 font-medium'>Highest / Lowest</p>
              <h3 className='text-xl font-bold'>
                {Math.round(outcome.highestScore)} / {Math.round(outcome.lowestScore)}
              </h3>
            </div>
          </CardContent>
        </Card>
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
