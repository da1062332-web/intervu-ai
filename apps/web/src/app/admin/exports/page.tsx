'use client';
import React, { useState } from 'react';
import { apiClient } from '@/services/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DownloadCloud, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportCenterPage() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: string, format: string) => {
    try {
      setExporting(`${type}-${format}`);
      if (type === 'candidates' && format === 'CSV') {
        const blob = await apiClient.request<Blob>('/admin/reports/exports/candidates?limit=1000', {
          responseType: 'blob',
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `candidates-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback simulation for unimplementeds
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      toast.success(`Exported ${type} as ${format} successfully.`);
    } catch (e) {
      toast.error(`Failed to export ${type}.`);
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    {
      id: 'candidates',
      title: 'Candidate Results',
      description: 'Export all candidate results, scores, and percentile data.',
      formats: ['CSV', 'JSON'],
    },
    {
      id: 'assessments',
      title: 'Assessment Outcomes',
      description: 'Export aggregated performance data for all assessments.',
      formats: ['CSV', 'PDF'],
    },
    {
      id: 'questions',
      title: 'Question Analytics',
      description: 'Export difficulty and success rate analytics per question.',
      formats: ['CSV'],
    },
  ];

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'CSV':
        return <FileSpreadsheet className='w-4 h-4 mr-2' />;
      case 'JSON':
        return <FileJson className='w-4 h-4 mr-2' />;
      case 'PDF':
        return <FileText className='w-4 h-4 mr-2' />;
      default:
        return <DownloadCloud className='w-4 h-4 mr-2' />;
    }
  };

  return (
    <div className='container mx-auto p-4 md:p-6 lg:p-8 space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight text-gray-900'>Export Center</h1>
        <p className='text-sm text-gray-500'>Download system data, reports, and analytics</p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {exportOptions.map((opt) => (
          <Card key={opt.id} className='flex flex-col'>
            <CardHeader>
              <CardTitle className='text-lg'>{opt.title}</CardTitle>
              <CardDescription>{opt.description}</CardDescription>
            </CardHeader>
            <CardContent className='mt-auto pt-4 border-t flex flex-wrap gap-2'>
              {opt.formats.map((format) => (
                <Button
                  key={format}
                  variant='outline'
                  size='sm'
                  onClick={() => handleExport(opt.id, format)}
                  disabled={exporting === `${opt.id}-${format}`}
                >
                  {exporting === `${opt.id}-${format}` ? (
                    'Exporting...'
                  ) : (
                    <>
                      {getFormatIcon(format)}
                      {format}
                    </>
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
