'use client';

import { useState } from 'react';
import { Download, FileText, Database, ShieldAlert, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { useSessionStore } from '@/store/session.store';

export function ExportControls() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const triggerExport = async (
    type: 'questions' | 'reviews' | 'assessments',
    format: 'csv' | 'json',
  ) => {
    const key = `${type}-${format}`;
    try {
      setDownloading(key);
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/admin/export/${type}?format=${format}`;
      const token = useSessionStore.getState().accessToken;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate export file');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${type}_export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success(`Successfully exported ${type} as ${format.toUpperCase()}.`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to export ${type}. Make sure you are logged in.`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Card className='glass border border-border shadow-lg'>
      <CardHeader>
        <CardTitle className='text-lg font-heading font-semibold text-foreground flex items-center gap-2'>
          <Download className='size-5 text-primary' />
          Admin Operational Exports
        </CardTitle>
        <CardDescription>
          Download structured CSV or JSON snapshots of primary platform registers.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4 sm:grid-cols-3'>
        {/* Questions Export */}
        <div className='flex flex-col gap-2 p-4 border border-border/60 rounded-xl bg-card/40 hover:bg-card/75 transition-colors'>
          <div className='flex items-center gap-2 text-foreground font-semibold text-sm mb-1'>
            <Database className='size-4 text-indigo-500' />
            Question Bank Register
          </div>
          <div className='flex gap-2 mt-auto'>
            <button
              onClick={() => triggerExport('questions', 'csv')}
              disabled={downloading !== null}
              className='flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors'
            >
              {downloading === 'questions-csv' ? (
                <Loader2 className='size-3 animate-spin' />
              ) : (
                <Download className='size-3' />
              )}
              CSV
            </button>
            <button
              onClick={() => triggerExport('questions', 'json')}
              disabled={downloading !== null}
              className='flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border border-input hover:bg-accent text-accent-foreground flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors'
            >
              {downloading === 'questions-json' ? (
                <Loader2 className='size-3 animate-spin' />
              ) : (
                <Download className='size-3' />
              )}
              JSON
            </button>
          </div>
        </div>

        {/* Reviews Export */}
        <div className='flex flex-col gap-2 p-4 border border-border/60 rounded-xl bg-card/40 hover:bg-card/75 transition-colors'>
          <div className='flex items-center gap-2 text-foreground font-semibold text-sm mb-1'>
            <ShieldAlert className='size-4 text-emerald-500' />
            Review Queue History
          </div>
          <div className='flex gap-2 mt-auto'>
            <button
              onClick={() => triggerExport('reviews', 'csv')}
              disabled={downloading !== null}
              className='flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors'
            >
              {downloading === 'reviews-csv' ? (
                <Loader2 className='size-3 animate-spin' />
              ) : (
                <Download className='size-3' />
              )}
              CSV
            </button>
            <button
              onClick={() => triggerExport('reviews', 'json')}
              disabled={downloading !== null}
              className='flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border border-input hover:bg-accent text-accent-foreground flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors'
            >
              {downloading === 'reviews-json' ? (
                <Loader2 className='size-3 animate-spin' />
              ) : (
                <Download className='size-3' />
              )}
              JSON
            </button>
          </div>
        </div>

        {/* Assessments Export */}
        <div className='flex flex-col gap-2 p-4 border border-border/60 rounded-xl bg-card/40 hover:bg-card/75 transition-colors'>
          <div className='flex items-center gap-2 text-foreground font-semibold text-sm mb-1'>
            <FileText className='size-4 text-amber-500' />
            Assembled Test Configs
          </div>
          <div className='flex gap-2 mt-auto'>
            <button
              onClick={() => triggerExport('assessments', 'csv')}
              disabled={downloading !== null}
              className='flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors'
            >
              {downloading === 'assessments-csv' ? (
                <Loader2 className='size-3 animate-spin' />
              ) : (
                <Download className='size-3' />
              )}
              CSV
            </button>
            <button
              onClick={() => triggerExport('assessments', 'json')}
              disabled={downloading !== null}
              className='flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border border-input hover:bg-accent text-accent-foreground flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors'
            >
              {downloading === 'assessments-json' ? (
                <Loader2 className='size-3 animate-spin' />
              ) : (
                <Download className='size-3' />
              )}
              JSON
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
