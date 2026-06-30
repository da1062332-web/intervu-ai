'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, CheckCircle2, Clock, Layers, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api/client';
import { TopicDistributionChart } from '@/components/assembly/TopicDistributionChart';
import { DifficultyDistributionChart } from '@/components/assembly/DifficultyDistributionChart';
import { CoverageChart } from '@/components/assembly/CoverageChart';
import { AssemblyHealthCard } from '@/components/assembly/AssemblyHealthCard';

export default function AssemblyPreviewPage() {
  const router = useRouter();
  const params = useParams();

  const [assembly, setAssembly] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [versions, setVersions] = useState<any>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchData(params.id as string);
    }
  }, [params.id]);

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      const [assemblyData, analyticsData, versionsData] = await Promise.all([
        apiClient.request<any>(`/assembly/${id}`),
        apiClient.request<any>(`/assembly/${id}/analytics`).catch(() => null),
        apiClient.request<any>(`/assembly/${id}/versions`).catch(() => []),
      ]);
      setAssembly(assemblyData);
      if (analyticsData) setAnalytics(analyticsData);
      if (versionsData) setVersions(versionsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load assembly');
      router.push('/admin/assembly');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    try {
      await apiClient.request(`/assembly/${params.id}/publish`, { method: 'POST' });
      toast.success('Assembly published successfully!');
      setAssembly((prev: any) => ({ ...prev, status: 'PUBLISHED' }));
      fetchData(params.id as string);
    } catch (error: any) {
      toast.error(error.message || 'Validation failed. Cannot publish.');
    }
  };

  const handleCreateVersion = async () => {
    try {
      await apiClient.request(`/assembly/${params.id}/version`, { method: 'POST' });
      toast.success('Version created successfully!');
      fetchData(params.id as string);
    } catch (error: any) {
      toast.error('Failed to create version');
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      await apiClient.request(`/assembly/${params.id}/restore/${versionId}`, { method: 'POST' });
      toast.success('Version restored successfully!');
      fetchData(params.id as string);
    } catch (error: any) {
      toast.error('Failed to restore version');
    }
  };

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-[50vh]'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!assembly) return null;

  const totalQuestions =
    assembly.sections?.reduce((acc: number, s: any) => acc + (s.questions?.length || 0), 0) || 0;

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto pb-24'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => router.push('/admin/assembly')}>
          <ArrowLeft className='h-5 w-5' />
        </Button>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-3xl font-bold tracking-tight'>Test Assembly Preview</h1>
            <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200 gap-1'>
              <CheckCircle2 className='h-3 w-3' />
              {assembly.status}
            </Badge>
          </div>
          <p className='text-muted-foreground mt-1'>Instance ID: {assembly.id}</p>
        </div>
        <div className='ml-auto flex gap-2'>
          <Button variant='outline' onClick={handleCreateVersion}>
            Save Version
          </Button>
          {assembly.status !== 'PUBLISHED' && (
            <Button onClick={handlePublish}>Publish Assembly</Button>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <Card>
          <CardContent className='pt-6 flex items-center gap-4'>
            <div className='p-3 bg-primary/10 rounded-full'>
              <Layers className='h-6 w-6 text-primary' />
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Sections</p>
              <p className='text-2xl font-bold'>{assembly.sections?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6 flex items-center gap-4'>
            <div className='p-3 bg-blue-100 rounded-full'>
              <Hash className='h-6 w-6 text-blue-700' />
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Total Questions</p>
              <p className='text-2xl font-bold'>{totalQuestions}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6 flex items-center gap-4'>
            <div className='p-3 bg-orange-100 rounded-full'>
              <Clock className='h-6 w-6 text-orange-700' />
            </div>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>Total Duration</p>
              <p className='text-2xl font-bold'>
                {Math.round(
                  (assembly.sections?.reduce((acc: number, s: any) => acc + s.durationSeconds, 0) ||
                    0) / 60,
                )}{' '}
                Mins
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {analytics && (
        <div className='mb-8'>
          <h2 className='text-2xl font-semibold tracking-tight border-b pb-2 mb-4'>
            Distribution Analytics
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <TopicDistributionChart distribution={analytics.topicDistribution} />
            <DifficultyDistributionChart distribution={analytics.difficultyDistribution} />
            <CoverageChart
              coveragePercentage={analytics.coverageDistribution?.overallCoverage || 0}
            />
            <AssemblyHealthCard
              isValid={analytics.coverageDistribution?.overallCoverage === 100}
              warnings={
                analytics.coverageDistribution?.overallCoverage < 100
                  ? ['Question coverage is below 100%']
                  : []
              }
            />
          </div>
        </div>
      )}

      {versions?.length > 0 && (
        <div className='mb-8'>
          <h2 className='text-2xl font-semibold tracking-tight border-b pb-2 mb-4'>
            Version History
          </h2>
          <Card>
            <CardContent className='p-0 divide-y'>
              {versions.map((v: any) => (
                <div key={v.id} className='p-4 flex justify-between items-center'>
                  <div>
                    <p className='font-medium'>Version {v.version}</p>
                    <p className='text-sm text-muted-foreground'>
                      {new Date(v.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button variant='outline' size='sm' onClick={() => handleRestoreVersion(v.id)}>
                    Restore
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className='space-y-8'>
        <h2 className='text-2xl font-semibold tracking-tight border-b pb-2'>Assembled Sections</h2>

        {assembly.sections?.map((section: any, index: number) => (
          <Card
            key={section.id || section.sectionId || index}
            className='overflow-hidden border-t-4 border-t-primary'
          >
            <CardHeader className='bg-muted/30 pb-4'>
              <div className='flex justify-between items-start'>
                <div>
                  <CardTitle className='text-xl'>
                    {section.sectionName ||
                      section.displayName ||
                      section.sectionKey ||
                      `Section ${index + 1}`}
                  </CardTitle>
                  <CardDescription className='mt-1 flex gap-4'>
                    <span className='flex items-center gap-1'>
                      <Hash className='h-3.5 w-3.5' />
                      {section.questions?.length || 0} Questions
                    </span>
                    <span className='flex items-center gap-1'>
                      <Clock className='h-3.5 w-3.5' />
                      {Math.round(section.durationSeconds / 60)} Minutes
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='divide-y'>
                {section.questions?.map((q: any, qIndex: number) => {
                  const snap = q.questionSnapshot || {};
                  return (
                    <div
                      key={q.id || q.questionId || qIndex}
                      className='p-4 hover:bg-muted/20 transition-colors flex flex-col md:flex-row gap-4'
                    >
                      <div className='flex-shrink-0 w-12 h-12 bg-muted rounded-md flex items-center justify-center font-bold text-muted-foreground'>
                        Q{q.questionOrder}
                      </div>
                      <div className='flex-1 space-y-2'>
                        <div className='flex justify-between items-start gap-4'>
                          <p className='font-medium line-clamp-2'>
                            {snap.questionText || 'Question text not available in snapshot'}
                          </p>
                        </div>
                        <div className='flex flex-wrap gap-2 pt-1'>
                          <Badge
                            variant={
                              snap.difficultyLevel === 'HARD'
                                ? 'destructive'
                                : snap.difficultyLevel === 'MEDIUM'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {snap.difficultyLevel || 'UNKNOWN'}
                          </Badge>
                          <Badge variant='outline' className='bg-blue-50 text-blue-700'>
                            {snap.conceptKey || 'General'}
                          </Badge>
                          <Badge variant='outline'>Type: {snap.questionType || 'Standard'}</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(!section.questions || section.questions.length === 0) && (
                  <div className='p-8 text-center text-muted-foreground'>
                    No questions allocated to this section.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
