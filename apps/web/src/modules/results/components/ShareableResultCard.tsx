import React, { useEffect, useState } from 'react';
import { apiClient } from '@/services/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareableReport {
  assessment: {
    id: string;
    title: string;
  };
  score: number;
  percentile: number;
  rank: number;
  completedAt: string;
}

export const ShareableResultCard = ({ attemptId }: { attemptId: string }) => {
  const [report, setReport] = useState<ShareableReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        // Using apiClient for API call
        const data = await apiClient.request<any>(`/reports/share/${attemptId}`, {
          method: 'GET',
        });
        
        if (data && data.status === 'PENDING') {
          return;
        }
        
        setReport(data);
      } catch (e: any) {
        if (e?.status !== 404) {
          console.error('Failed to load shareable report', e);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [attemptId]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/candidate/results/${attemptId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !report) return null;

  return (
    <Card className='bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm mt-8'>
      <CardHeader>
        <div className='flex justify-between items-center'>
          <div>
            <CardTitle className='text-xl font-bold text-indigo-900'>Share Your Result</CardTitle>
            <CardDescription>Showcase your achievement with others</CardDescription>
          </div>
          <Share2 className='text-indigo-400 w-6 h-6' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-6 rounded-lg border border-indigo-50'>
          <div className='flex-1 text-center md:text-left'>
            <h3 className='text-sm font-medium text-gray-500 uppercase tracking-wider mb-1'>
              Assessment
            </h3>
            <p className='text-lg font-bold text-gray-900'>{report.assessment.title}</p>
            <p className='text-sm text-gray-500 mt-1'>
              Completed: {new Date(report.completedAt).toLocaleDateString()}
            </p>
          </div>

          <div className='flex gap-8 justify-center'>
            <div className='text-center'>
              <div className='text-3xl font-black text-indigo-600'>{report.score}</div>
              <div className='text-xs font-semibold text-gray-500 uppercase mt-1'>Score</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-black text-indigo-600'>
                Top {100 - report.percentile}%
              </div>
              <div className='text-xs font-semibold text-gray-500 uppercase mt-1'>Percentile</div>
            </div>
          </div>
        </div>

        <div className='flex justify-end gap-3 mt-6'>
          <Button
            variant='outline'
            className='border-indigo-200 text-indigo-700 hover:bg-indigo-50'
            onClick={handleCopyLink}
          >
            {copied ? <Check className='w-4 h-4 mr-2' /> : <Copy className='w-4 h-4 mr-2' />}
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
          <Button
            className='bg-indigo-600 hover:bg-indigo-700 text-white'
            onClick={() => window.print()}
          >
            <Download className='w-4 h-4 mr-2' />
            Save Image
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
