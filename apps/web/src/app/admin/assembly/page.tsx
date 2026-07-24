'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, FileText, Play, ArrowLeft, Info } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api/client';
import Link from 'next/link';
import { useTopics } from '@/services/topics/hooks';
import { SectionHeader } from '@/components/ui/section-header';
import { WidgetSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';

export default function AssemblyDashboardPage() {
  const router = useRouter();

  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  // Fetch topics so we can resolve topic names in error messages
  const { data: topics } = useTopics(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const data = await apiClient.request<any[]>('/admin/configs');
      setConfigs(data || []);
    } catch (error) {
      console.error('Failed to fetch configs', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAssembly = async (configId: string) => {
    setGenerating(configId);
    try {
      const response = await apiClient.request<{ testInstanceId: string }>(
        '/assembly/tests/generate',
        {
          method: 'POST',
          body: { configId },
        },
      );

      if (response && response.testInstanceId) {
        toast.success('Successfully assembled test instance.');
        router.push(`/admin/assembly/${response.testInstanceId}`);
      } else {
        throw new Error('Failed to generate assembly');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to generate assembly';
      if (errorMsg.includes('has no sections defined')) {
        toast.error('This exam config has no sections. Redirecting to fix it...', {
          duration: 4000,
        });
        setTimeout(() => {
          router.push(`/admin/configurations/${configId}/edit`);
        }, 1500);
      } else {
        // Attempt to replace any UUIDs in the error message with actual topic names
        let displayMsg = errorMsg;
        const uuidRegex = /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/g;
        displayMsg = displayMsg.replace(uuidRegex, (match: string) => {
          const foundTopic = topics?.find((t: any) => t.id === match);
          return foundTopic ? `"${foundTopic.name}"` : match;
        });
        toast.error(displayMsg);
      }
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6'>
      <SectionHeader
        title='Test Assembly'
        description='Generate full test instances from your exam configurations. Each assembly contains sections, questions, and analytics.'
        breadcrumbs={[{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Assembly' }]}
      />

      {/* Workflow Guide */}
      <div className='flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30 p-4'>
        <Info className='w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0' />
        <div className='text-sm text-indigo-800 dark:text-indigo-300'>
          <p className='font-medium'>Complete Assembly Lifecycle</p>
          <p className='mt-0.5 text-indigo-700 dark:text-indigo-400'>
            <span className='font-semibold'>1. Templates</span> define structure →{' '}
            <span className='font-semibold'>2. Exam Configs</span> set rules →{' '}
            <span className='font-semibold'>3. Assembly Engine</span> builds the test →{' '}
            <span className='font-semibold'>4. Review & Analytics</span> →{' '}
            <span className='font-semibold'>5. Save Version & Publish</span>.
            <br />
            Click <strong>Generate Test Assembly</strong> below to begin step 3.
          </p>
        </div>
        <Link href='/admin/templates' className='shrink-0'>
          <Button
            variant='outline'
            size='sm'
            className='text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:border-indigo-700 dark:text-indigo-400'
          >
            <ArrowLeft className='w-3.5 h-3.5 mr-1.5' />
            View Templates
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <WidgetSkeleton />
          <WidgetSkeleton />
          <WidgetSkeleton />
        </div>
      ) : configs.length === 0 ? (
        <EmptyState
          title='No Exam Configurations Found'
          description='An Exam Configuration defines the test structure (sections, question counts, duration). You need at least one before generating an assembly.'
          actionLabel='Create Exam Config'
          onactions={() => router.push('/admin/configurations/new')}
          className='py-12 border border-dashed'
        />
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {configs.map((config) => (
            <Card key={config.id} className='flex flex-col hover:shadow-md transition-shadow'>
              <CardHeader>
                <div className='flex justify-between items-start mb-2'>
                  <div className='flex items-center gap-2 text-primary'>
                    <FileText className='h-5 w-5' />
                    <span className='text-sm font-medium'>Config: {config.code || 'N/A'}</span>
                  </div>
                  <Badge variant={config.status === 'PUBLISHED' || config.status === 'ACTIVE' ? 'default' : 'secondary'} className={config.status === 'PUBLISHED' || config.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}>
                    {config.status === 'ACTIVE'
                      ? 'Active'
                      : config.status === 'DRAFT'
                        ? 'Draft'
                        : config.status === 'VALIDATED'
                          ? 'Validated'
                          : config.status === 'PUBLISHED'
                            ? 'Published'
                            : 'Archived'}
                  </Badge>
                </div>
                <CardTitle className='line-clamp-1'>{config.name || 'Untitled'}</CardTitle>
                <CardDescription>
                  {config.totalQuestions} Questions • {config.durationMinutes} Mins
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-1'>
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p>Role: {config.role || 'N/A'}</p>
                </div>
              </CardContent>
              <CardFooter className='pt-4 border-t bg-muted/20'>
                <Button
                  className='w-full gap-2'
                  onClick={() => generateAssembly(config.id)}
                  disabled={generating === config.id}
                  isLoading={generating === config.id}
                >
                  {generating !== config.id && <Play className='h-4 w-4' />}
                  {generating === config.id ? 'Assembling...' : 'Generate Test Assembly'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
