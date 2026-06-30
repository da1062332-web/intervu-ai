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
import { Loader2, Plus, FileText, Settings, Play, ArrowLeft, Info } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api/client';
import Link from 'next/link';

export default function AssemblyDashboardPage() {
  const router = useRouter();

  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

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
      toast.error(error.message || 'Failed to generate assembly');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className='p-6 space-y-6 max-w-7xl mx-auto'>
      {/* Page Header */}
      <div className='flex justify-between items-start'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Test Assembly</h1>
          <p className='text-muted-foreground mt-1'>
            Generate full test instances from your exam configurations. Each assembly contains
            sections, questions, and analytics.
          </p>
        </div>
      </div>

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
        <div className='flex justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      ) : configs.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-12 gap-4'>
            <Settings className='h-12 w-12 text-muted-foreground' />
            <div className='text-center'>
              <h2 className='text-xl font-semibold'>No Exam Configurations Found</h2>
              <p className='text-muted-foreground mt-2 max-w-md text-center'>
                An <strong>Exam Configuration</strong> defines the test structure (sections,
                question counts, duration). You need at least one before generating an assembly.
              </p>
            </div>
            <div className='flex gap-3'>
              <Link href='/admin/configurations'>
                <Button>
                  <Plus className='h-4 w-4 mr-2' />
                  Create Exam Config
                </Button>
              </Link>
              <Link href='/admin/templates'>
                <Button variant='outline'>View Templates</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {configs.map((config) => (
            <Card key={config.id} className='flex flex-col hover:shadow-md transition-shadow'>
              <CardHeader>
                <div className='flex items-center gap-2 text-primary mb-2'>
                  <FileText className='h-5 w-5' />
                  <span className='text-sm font-medium'>Config: {config.code || 'N/A'}</span>
                </div>
                <CardTitle className='line-clamp-1'>{config.name || 'Untitled'}</CardTitle>
                <CardDescription>
                  {config.totalQuestions} Questions • {config.durationMinutes} Mins
                </CardDescription>
              </CardHeader>
              <CardContent className='flex-1'>
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p>Role: {config.role || 'N/A'}</p>
                  <p>
                    Status:{' '}
                    {config.status === 'ACTIVE'
                      ? 'Active'
                      : config.status === 'DRAFT'
                        ? 'Draft'
                        : config.status === 'VALIDATED'
                          ? 'Validated'
                          : config.status === 'PUBLISHED'
                            ? 'Published'
                            : 'Archived'}
                  </p>
                </div>
              </CardContent>
              <CardFooter className='pt-4 border-t bg-muted/20'>
                <Button
                  className='w-full gap-2'
                  onClick={() => generateAssembly(config.id)}
                  disabled={generating === config.id}
                >
                  {generating === config.id ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Play className='h-4 w-4' />
                  )}
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
