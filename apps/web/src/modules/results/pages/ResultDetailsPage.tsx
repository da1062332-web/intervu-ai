'use client';

import React from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useResultDetails } from '../hooks/results.hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResultStatusTracker } from '../components/ResultStatusTracker';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  Share2,
  CheckCircle2,
  Target,
  XCircle,
} from 'lucide-react';
import { PerformanceInsightsDashboard } from '../components/PerformanceInsightsDashboard';

export const ResultDetailsPage = () => {
  const params = useParams();
  const attemptId = params?.attemptId as string;
  const router = useRouter();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const navigate = router.push;
  const {
    data: result,
    isLoading: detailsLoading,
    isError,
    refetch,
  } = useResultDetails(attemptId || '');

  const [isExportingPdf, setIsExportingPdf] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (detailsLoading || !result) {
      const interval = setInterval(() => {
        setProgress((prev: number) => (prev >= 90 ? prev : prev + Math.random() * 10));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [detailsLoading, result]);

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      toast.info('Preparing your PDF report... Please hold on.', { duration: 3000 });
      await new Promise((r) => setTimeout(r, 150)); // Allow UI notifications to settle

      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = await import('jspdf');

      const sections = document.querySelectorAll('.pdf-section');
      if (!sections.length) {
        toast.error('No report sections found to export.');
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      let currentY = margin;

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        if (!section || section.clientHeight === 0) continue;

        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
        });

        if (!canvas || canvas.width === 0 || canvas.height === 0) continue;

        const imgData = canvas.toDataURL('image/png', 1.0);
        if (!imgData || !imgData.startsWith('data:image/')) continue;

        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = pdfWidth - margin * 2;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        if (currentY + imgHeight > pdfHeight - margin && i > 0) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 6;
      }

      // Add Headers and Footers to each generated page
      const pageCount = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        const footerY = pdfHeight - 8;
        pdf.text('InterVu AI', margin, footerY);
        pdf.text(
          `Candidate Performance Report • ${new Date().toLocaleDateString()}`,
          pdfWidth / 2,
          footerY,
          { align: 'center' },
        );
        pdf.text(`Page ${i} of ${pageCount}`, pdfWidth - margin, footerY, { align: 'right' });
      }

      pdf.save(`Assessment_Report_${attemptId.slice(0, 8)}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (e: any) {
      console.error('PDF Export Error:', e);
      toast.error('Failed to generate PDF: ' + (e?.message || 'Unexpected error occurred'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleShareResult = async () => {
    const canonicalPath = `/candidate/results/${attemptId}`;
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${canonicalPath}` : '';
    const title = `Performance Report - ${result?.assessmentName || 'Assessment'}`;
    const text = `Check out my verified assessment performance report for ${result?.assessmentName || 'Assessment'}!`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        toast.success('Result shared successfully');
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        // Fallback to clipboard on error
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl || window.location.href);
      toast.success('Shareable candidate report link copied to clipboard');
    } else {
      toast.info(`Share link: ${shareUrl}`);
    }
  };

  if (detailsLoading || isError || !result) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background px-4'>
        <div className='bg-card text-card-foreground rounded-2xl shadow-xs border border-border/60 p-10 flex flex-col items-center max-w-md w-full text-center'>
          <div className='relative mb-6'>
            <div className='w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin' />
            <div className='absolute inset-0 flex items-center justify-center'>
              <Target className='size-8 text-primary' />
            </div>
          </div>

          <h2 className='text-2xl font-bold text-foreground mb-2'>Generating Your Results</h2>
          <p className='text-muted-foreground text-sm leading-relaxed mb-6'>
            Evaluating answers and computing performance metrics.
          </p>

          <div className='w-full bg-muted rounded-full h-2 overflow-hidden'>
            <div
              className='h-2 bg-primary rounded-full transition-all duration-500 ease-out'
              style={{ width: `${Math.min(progress, 95)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  const initial = (result.assessmentName || 'Assessment').charAt(0).toUpperCase();
  const isQualified =
    result.qualification && result.qualification.toUpperCase() !== 'NOT_QUALIFIED';
  const formattedDate = new Date(result.submittedAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      id='pdf-content'
      className='container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-7xl space-y-6 animate-fade-in-up'
    >
      {/* 1. Top Navigation & Action Buttons */}
      <div
        className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden'
        data-html2canvas-ignore='true'
      >
        <Button
          variant='ghost'
          className='text-muted-foreground hover:text-foreground font-semibold text-xs flex items-center gap-2 p-0 hover:bg-transparent'
          onClick={() => navigate(isAdminRoute ? '/admin/dashboard' : '/candidate/dashboard')}
        >
          <ArrowLeft className='w-4 h-4' />
          <span>Back to Dashboard</span>
        </Button>

        <div className='flex flex-wrap items-center gap-3 w-full sm:w-auto'>
          <Button
            variant='outline'
            className='rounded-xl font-bold text-sm bg-card border-border/80 text-foreground px-4 py-2 flex items-center gap-2 shadow-2xs hover:bg-muted/50 transition-all'
            onClick={handleExportPdf}
            disabled={isExportingPdf}
          >
            <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            <Download className='w-4 h-4 text-muted-foreground' />
          </Button>

          <Button
            variant='outline'
            className='rounded-xl font-bold text-sm bg-card border-border/80 text-foreground px-4 py-2 flex items-center gap-2 shadow-2xs hover:bg-muted/50 transition-all'
            onClick={handleShareResult}
          >
            <Share2 className='w-4 h-4 text-muted-foreground' />
            <span>Share Result</span>
          </Button>
        </div>
      </div>

      <ResultStatusTracker attemptId={attemptId!} onComplete={refetch} />

      {/* 2. Hero Qualification & Assessment Header Card */}
      <div className='pdf-section'>
        <Card className='rounded-2xl border-border/60 bg-card text-card-foreground shadow-2xs overflow-hidden print:break-inside-avoid'>
          <CardContent className='p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6'>
            <div className='flex items-center gap-4'>
              <div className='w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-xs'>
                {initial}
              </div>
              <div>
                <h1 className='text-2xl font-extrabold text-foreground tracking-tight'>
                  {result.assessmentName}
                </h1>
                <p className='text-xs text-muted-foreground font-medium mt-1 mb-1'>
                  {formattedDate} ·{' '}
                  <span className='font-semibold text-foreground'>
                    Submission ID: {attemptId.slice(0, 10).toUpperCase()}
                  </span>
                </p>
                {result.candidate && (
                  <div className='flex flex-col mt-1'>
                    <span className='text-sm font-bold text-foreground'>
                      {result.candidate.fullName}
                    </span>
                    <span className='text-xs text-muted-foreground'>{result.candidate.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Qualification Banner */}
            <div className='flex items-center gap-3 w-full md:w-auto justify-end'>
              {isQualified ? (
                <div className='w-full md:w-auto p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center gap-3'>
                  <div className='p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 shrink-0'>
                    <CheckCircle2 className='w-5 h-5' />
                  </div>
                  <div>
                    <span className='text-xs font-extrabold uppercase tracking-wider block'>
                      QUALIFIED ({result.qualification?.replace('_', ' ')})
                    </span>
                    <span className='text-[11px] opacity-80 font-medium'>
                      {result.qualificationReason ||
                        'Congratulations! You met the corporate qualification criteria.'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className='w-full md:w-auto p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3'>
                  <div className='p-2 rounded-xl bg-destructive/20 shrink-0'>
                    <XCircle className='w-5 h-5' />
                  </div>
                  <div>
                    <span className='text-xs font-extrabold uppercase tracking-wider block'>
                      NOT QUALIFIED
                    </span>
                    <span className='text-[11px] opacity-80 font-medium'>
                      {result.qualificationReason || 'Qualification cutoff not met.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Performance Insights Dashboard */}
      <PerformanceInsightsDashboard attemptId={attemptId!} resultDetails={result} />

      {/* 4. Print Footer */}
      <div
        className='hidden print:flex fixed bottom-0 left-0 right-0 w-full justify-between items-center text-[10px] text-gray-500 bg-white pt-2 border-t border-gray-200'
        data-html2canvas-ignore='true'
      >
        <div className='font-semibold text-gray-800'>InterVu AI</div>
        <div>
          Candidate Performance Report • {new Date().toLocaleDateString()}{' '}
          {new Date().toLocaleTimeString()}
        </div>
        <div className='italic'>Confidential Document</div>
      </div>
    </div>
  );
};
