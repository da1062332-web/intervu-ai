'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/admin/layout/dashboard-layout';

export default function AssessmentSubmittedPage() {
  const searchParams = useSearchParams();
  const testId = searchParams?.get('testId');
  const router = useRouter();

  const submissionTime = new Date().toLocaleString();

  return (
    <ProtectedRoute allowedRoles={['CANDIDATE']}>
      <DashboardLayout>
        <div className='flex items-center justify-center min-h-[80vh] p-4'>
          <Card className='max-w-md w-full text-center shadow-lg border-primary/10'>
            <CardHeader className='pt-8 pb-4'>
              <div className='mx-auto bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mb-6'>
                <CheckCircle2 size={32} />
              </div>
              <CardTitle className='text-2xl font-bold text-slate-800'>
                Submission Successful
              </CardTitle>
              <CardDescription className='text-base mt-2'>
                Your assessment has been recorded successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6 pb-8'>
              <div className='bg-slate-50 p-4 rounded-lg space-y-3 text-sm text-left'>
                <div className='flex justify-between items-center border-b pb-2'>
                  <span className='text-slate-500 font-medium'>Assessment ID</span>
                  <span className='font-mono text-slate-900'>{testId || 'Unknown'}</span>
                </div>
                <div className='flex justify-between items-center border-b pb-2'>
                  <span className='text-slate-500 font-medium'>Submission Time</span>
                  <span className='text-slate-900'>{submissionTime}</span>
                </div>
                <div className='flex justify-between items-center pt-1'>
                  <span className='text-slate-500 font-medium'>Status</span>
                  <span className='text-amber-600 font-semibold'>Evaluation Pending</span>
                </div>
              </div>

              <div className='pt-4'>
                <Button
                  className='w-full'
                  size='lg'
                  onClick={() => router.push('/candidate/dashboard')}
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
