'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

export function RuntimeHealthDashboard() {
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery({
    queryKey: ['runtime-metrics'],
    queryFn: () => apiClient.request<any>('/runtime/metrics'),
    refetchInterval: 30000,
  });

  const { data: buildsData, isLoading: buildsLoading } = useQuery({
    queryKey: ['runtime-builds'],
    queryFn: () => apiClient.request<any>('/runtime/builds'),
    refetchInterval: 30000,
  });

  if (metricsLoading) {
    return (
      <div className='flex justify-center items-center py-12 border rounded-lg bg-muted/10'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (metricsError) {
    return (
      <div className='p-4 bg-red-50 text-red-900 rounded-md border border-red-200'>
        Error loading metrics: {(metricsError as any).message}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
              <Activity className='h-4 w-4' /> Total Builds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>{metrics?.runtimeBuilds || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
              <CheckCircle className='h-4 w-4 text-green-600' /> Successful Builds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold text-green-600'>{metrics?.successfulBuilds || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
              <XCircle className='h-4 w-4 text-red-600' /> Failed Builds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold text-red-600'>{metrics?.failedBuilds || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
              <XCircle className='h-4 w-4 text-orange-500' /> Validation Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold text-orange-600'>{metrics?.validationFailures || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
              <Clock className='h-4 w-4' /> Avg Gen Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>
              {Math.round(metrics?.averageGenerationTime || 0)}{' '}
              <span className='text-base font-normal text-muted-foreground'>ms</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground flex items-center gap-2'>
              <Clock className='h-4 w-4' /> Avg Load Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-3xl font-bold'>
              {Math.round(metrics?.averageLoadTime || 0)}{' '}
              <span className='text-base font-normal text-muted-foreground'>ms</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Builds</CardTitle>
        </CardHeader>
        <CardContent>
          {buildsLoading ? (
            <div className='flex justify-center p-4'>
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          ) : buildsData?.builds?.length ? (
            <div className='overflow-x-auto rounded-md border'>
              <table className='w-full text-sm text-left'>
                <thead className='text-xs text-muted-foreground uppercase bg-muted/50 border-b'>
                  <tr>
                    <th className='px-4 py-3 font-medium'>Build ID</th>
                    <th className='px-4 py-3 font-medium'>Test ID</th>
                    <th className='px-4 py-3 font-medium'>Status</th>
                    <th className='px-4 py-3 font-medium'>Duration</th>
                    <th className='px-4 py-3 font-medium'>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {buildsData.builds.map((build: any) => (
                    <React.Fragment key={build.id}>
                      <tr
                        className={`border-b hover:bg-muted/30 ${build.status === 'FAILED' && build.errors ? 'border-b-0' : ''}`}
                      >
                        <td className='px-4 py-3 font-mono text-xs'>{build.id}</td>
                        <td className='px-4 py-3 font-mono text-xs'>
                          <span className='truncate block max-w-[150px]' title={build.testId}>
                            {build.testId}
                          </span>
                        </td>
                        <td className='px-4 py-3'>
                          <Badge
                            variant={
                              build.status === 'COMPLETED'
                                ? 'default'
                                : build.status === 'FAILED'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className={
                              build.status === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700' : ''
                            }
                          >
                            {build.status}
                          </Badge>
                        </td>
                        <td className='px-4 py-3'>{build.durationMs} ms</td>
                        <td className='px-4 py-3 text-muted-foreground whitespace-nowrap'>
                          {new Date(build.createdAt).toLocaleString()}
                        </td>
                      </tr>
                      {build.status === 'FAILED' && build.errors && (
                        <tr className='border-b bg-red-50/30'>
                          <td colSpan={5} className='px-4 py-2 text-xs text-red-600'>
                            <strong>Failure Reason:</strong>{' '}
                            {typeof build.errors === 'string'
                              ? build.errors
                              : build.errors.error ||
                                build.errors.message ||
                                JSON.stringify(build.errors)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='text-center py-6 text-sm text-muted-foreground border rounded-md border-dashed'>
              No recent builds found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
