'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle2,
  Clock,
  Layers,
  Hash,
  Package,
  PlayCircle,
  AlertCircle,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api/client';
import { TopicDistributionChart } from '@/components/assembly/TopicDistributionChart';
import { DifficultyDistributionChart } from '@/components/assembly/DifficultyDistributionChart';
import { CoverageChart } from '@/components/assembly/CoverageChart';
import { AssemblyHealthCard } from '@/components/assembly/AssemblyHealthCard';
import { PageHeader } from '@/components/admin/dashboard/page-header';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { AnimatedLoader } from '@/components/ui/animated-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { CustomFormCard } from '@/components/ui/custom-form-card';
import Link from 'next/link';

export default function AssemblyPreviewPage() {
  const router = useRouter();
  const params = useParams();

  const [assembly, setAssembly] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

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

      const sortedVersions = (versionsData || []).sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setVersions(sortedVersions);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load assembly');
      router.push('/admin/assembly');
    } finally {
      setLoading(false);
    }
  };

  const hasVersionSnapshot = versions.length > 0;
  const latestVersion = hasVersionSnapshot ? versions[0] : null;

  const handlePublish = async () => {
    if (!hasVersionSnapshot) {
      toast.error('Cannot publish. Please save a version snapshot first.');
      return;
    }

    setIsPublishing(true);
    try {
      const readiness = await apiClient.request<any>(`/assembly/${params.id}/readiness`, {
        method: 'POST',
      });

      if (!readiness.ready) {
        const failedChecks = readiness.checks
          ?.filter((c: any) => !c.passed)
          .map((c: any) => c.message || c.name)
          .join('\n');

        toast.error(
          `Publish blocked. Readiness checks failed:\n${failedChecks || 'Unknown error'}`,
        );
        setIsPublishing(false);
        return;
      }

      await apiClient.request(`/assembly/${params.id}/publish`, { method: 'POST' });
      toast.success('Assembly published successfully!');
      setAssembly((prev: any) => ({ ...prev, status: 'PUBLISHED' }));
      fetchData(params.id as string);
    } catch (error: any) {
      toast.error(error.message || 'Validation failed. Cannot publish.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreateVersion = async () => {
    setIsSavingVersion(true);
    try {
      await apiClient.request(`/assembly/${params.id}/version`, { method: 'POST' });
      toast.success('Version snapshot created successfully.');
      await fetchData(params.id as string);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create version');
    } finally {
      setIsSavingVersion(false);
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

  const questionColumns: ColumnDef<any>[] = [
    {
      header: 'Order',
      cell: (row) => <span className='font-mono'>Q{row.questionOrder}</span>,
    },
    {
      header: 'Question Text',
      cell: (row) => {
        const snap = row.questionSnapshot || {};
        return (
          <span className='line-clamp-2 max-w-md'>
            {snap.questionText || 'Question text not available in snapshot'}
          </span>
        );
      },
    },
    {
      header: 'Difficulty',
      cell: (row) => {
        const snap = row.questionSnapshot || {};
        const diff = snap.difficultyLevel || 'UNKNOWN';
        return (
          <Badge variant={diff === 'HARD' ? 'destructive' : diff === 'MEDIUM' ? 'default' : 'secondary'}>
            {diff}
          </Badge>
        );
      },
    },
    {
      header: 'Concept',
      cell: (row) => {
        const snap = row.questionSnapshot || {};
        return (
          <Badge variant='outline' className='bg-blue-50 text-blue-700'>
            {snap.conceptKey || 'General'}
          </Badge>
        );
      },
    },
    {
      header: 'Type',
      cell: (row) => {
        const snap = row.questionSnapshot || {};
        return <Badge variant='outline'>{snap.questionType || 'Standard'}</Badge>;
      },
    },
  ];

  if (loading) {
    return (
      <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl'>
        <AnimatedLoader variant='table' />
      </div>
    );
  }

  if (!assembly) return null;

  const totalQuestions =
    assembly.sections?.reduce((acc: number, s: any) => acc + (s.questions?.length || 0), 0) || 0;

  const isPublished = assembly.status === 'PUBLISHED';

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6'>
      <PageHeader
        title='Test Assembly Preview'
        subtitle={`Instance ID: ${assembly.id}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard' },
          { label: 'Assembly', href: '/admin/assembly' },
          { label: 'Preview' }
        ]}
        action={
          <div className='flex items-center gap-3'>
            <Badge variant='outline' className={isPublished ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
              <CheckCircle2 className='h-3 w-3 mr-1' />
              {assembly.status}
            </Badge>
            <Button
              variant='outline'
              onClick={() => router.push(`/admin/assembly/${params.id}/package`)}
            >
              <Package className='h-4 w-4 mr-2' />
              Preview Package
            </Button>
            <Button variant='outline' onClick={() => router.push(`/admin/runtime/${params.id}`)}>
              <PlayCircle className='h-4 w-4 mr-2' />
              Runtime Preview
            </Button>
          </div>
        }
      />

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        {/* Readiness and Version Card */}
        <CustomFormCard
          title='Version & Readiness'
          description='Manage version snapshots and readiness for publishing.'
          className='md:col-span-3 border-2 border-primary/20 bg-primary/5'
        >
          <div className='flex justify-end gap-2 mb-4'>
            <Button
              variant='outline'
              onClick={handleCreateVersion}
              disabled={isSavingVersion || isPublished}
            >
              {isSavingVersion && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
              Save Version Snapshot
            </Button>

            <div className='relative group'>
              <Button
                onClick={handlePublish}
                disabled={!hasVersionSnapshot || isPublished || isPublishing}
                className='min-w-[140px]'
              >
                {isPublishing && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
                {isPublished ? 'Published' : 'Publish Assembly'}
              </Button>

              {!hasVersionSnapshot && !isPublished && (
                <div className='absolute bottom-full mb-2 right-0 hidden group-hover:block bg-popover text-popover-foreground border p-3 rounded-md shadow-lg text-sm w-56 z-50'>
                  <p className='font-semibold mb-2 flex items-center gap-1.5 text-amber-500'>
                    <AlertCircle className='h-4 w-4' /> Publish blocked
                  </p>
                  <p className='text-muted-foreground text-xs mb-2'>Missing requirements:</p>
                  <ul className='space-y-1 text-xs'>
                    <li className='flex items-center gap-2'>
                      <span className='w-3 h-3 border border-muted-foreground rounded-sm shrink-0' />
                      <span>Version Snapshot</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Latest Version Info */}
            <div>
              <h4 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3'>
                Current Snapshot
              </h4>
              {hasVersionSnapshot && latestVersion ? (
                <div className='bg-background p-4 rounded-lg border shadow-sm'>
                  <div className='flex justify-between items-start mb-2'>
                    <div>
                      <p className='font-bold text-lg'>Version {latestVersion.version}</p>
                      <p className='text-xs text-muted-foreground'>ID: {latestVersion.id}</p>
                    </div>
                    <Badge variant='secondary'>{isPublished ? 'Published' : 'Draft'}</Badge>
                  </div>
                  <div className='grid grid-cols-2 gap-2 mt-4 text-sm'>
                    <div>
                      <p className='text-muted-foreground text-xs'>Created</p>
                      <p className='font-medium'>
                        {new Date(latestVersion.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='bg-background p-6 rounded-lg border border-dashed border-amber-300 flex flex-col items-center justify-center text-center space-y-2 h-[120px]'>
                  <AlertCircle className='h-6 w-6 text-amber-500' />
                  <div>
                    <p className='font-semibold text-amber-700'>No Version Snapshot</p>
                    <p className='text-xs text-amber-600/80'>
                      Create a version before publishing.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Readiness Checks */}
            <div>
              <h4 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3'>
                Readiness Checks
              </h4>
              <div className='space-y-3 bg-background p-4 rounded-lg border shadow-sm'>
                <div className='flex justify-between items-center text-sm'>
                  <span className='flex items-center gap-2'>
                    {hasVersionSnapshot ? (
                      <CheckCircle2 className='h-4 w-4 text-green-500' />
                    ) : (
                      <AlertCircle className='h-4 w-4 text-red-500' />
                    )}
                    Version Snapshot Exists
                  </span>
                  <Badge
                    variant={hasVersionSnapshot ? 'default' : 'destructive'}
                    className={hasVersionSnapshot ? 'bg-green-100 text-green-800' : ''}
                  >
                    {hasVersionSnapshot ? 'Passed' : 'Missing'}
                  </Badge>
                </div>
                <div className='flex justify-between items-center text-sm'>
                  <span className='flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-green-500' />
                    Assembly Generated
                  </span>
                  <Badge variant='default' className='bg-green-100 text-green-800'>
                    Passed
                  </Badge>
                </div>
                {analytics && (
                  <div className='flex justify-between items-center text-sm'>
                    <span className='flex items-center gap-2'>
                      {analytics.coverageDistribution?.overallCoverage === 100 ? (
                        <CheckCircle2 className='h-4 w-4 text-green-500' />
                      ) : (
                        <AlertCircle className='h-4 w-4 text-amber-500' />
                      )}
                      Coverage at 100%
                    </span>
                    <Badge
                      variant={
                        analytics.coverageDistribution?.overallCoverage === 100
                          ? 'default'
                          : 'secondary'
                      }
                      className={
                        analytics.coverageDistribution?.overallCoverage === 100
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }
                    >
                      {analytics.coverageDistribution?.overallCoverage === 100
                        ? 'Passed'
                        : 'Warning'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CustomFormCard>

        {/* Existing summary cards */}
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
              {versions.map((v: any, index: number) => (
                <div key={v.id} className='p-4 flex justify-between items-center'>
                  <div>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium'>Version {v.version}</p>
                      {index === 0 && (
                        <Badge variant='secondary' className='text-xs'>
                          Latest
                        </Badge>
                      )}
                    </div>
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
              <DataTable
                columns={questionColumns}
                data={section.questions || []}
                emptyState={
                  <EmptyState
                    title='No Questions'
                    description='No questions allocated to this section.'
                  />
                }
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
