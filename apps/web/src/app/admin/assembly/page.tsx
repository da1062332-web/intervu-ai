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
import { Loader2, Plus, FileText, Settings, Play } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api/client';

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
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Test Assembly</h1>
          <p className='text-muted-foreground mt-1'>
            Generate and preview test instances from exam configurations.
          </p>
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </div>
      ) : configs.length === 0 ? (
        <Card className='border-dashed'>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <Settings className='h-12 w-12 text-muted-foreground mb-4' />
            <h2 className='text-xl font-semibold'>No Exam Configs Found</h2>
            <p className='text-muted-foreground mt-2 max-w-md text-center'>
              You need to create an Exam Configuration before you can generate a test assembly.
            </p>
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
