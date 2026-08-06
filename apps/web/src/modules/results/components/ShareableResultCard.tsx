import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, Download, Copy, Check, Trophy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  attemptId: string;
  result?: any;
  dashboardData?: any;
  onClose?: () => void;
}

export const ShareableResultCard: React.FC<Props> = ({ attemptId, result, dashboardData }) => {
  const [copied, setCopied] = useState(false);

  const assessmentTitle =
    result?.assessmentName || dashboardData?.assessmentName || 'Corporate Assessment';
  const score = dashboardData?.overallScore ?? result?.score ?? 0;
  const maxMarks =
    dashboardData?.maxMarks && dashboardData.maxMarks > 0
      ? dashboardData.maxMarks
      : result?.maxMarks && result.maxMarks > 0
      ? result.maxMarks
      : undefined;
  const percentile = dashboardData?.percentile ?? result?.percentile ?? 100;
  const rank = dashboardData?.rank ?? result?.rank;
  const completedAt = result?.submittedAt ? new Date(result.submittedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }) : new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/candidate/results/${attemptId}`;
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Shareable result link copied to clipboard');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Performance Report - ${assessmentTitle}`,
          text: `Check out my assessment result for ${assessmentTitle}! Score: ${score}${
            maxMarks ? `/${maxMarks}` : ''
          } (Top ${Math.max(1, 100 - Math.round(percentile))}%)`,
          url,
        });
        toast.success('Result shared successfully');
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Card className='rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card/95 to-primary/5 shadow-md overflow-hidden'>
      <CardHeader className='pb-4 pt-6 px-6 border-b border-border/60 bg-card/60 backdrop-blur-xs'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-2.5'>
            <div className='p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 shadow-2xs'>
              <Sparkles className='w-5 h-5' />
            </div>
            <div>
              <CardTitle className='text-lg font-extrabold text-foreground tracking-tight'>
                Share Your Achievement
              </CardTitle>
              <CardDescription className='text-xs text-muted-foreground mt-0.5'>
                Showcase your verified performance report with peers or recruiters
              </CardDescription>
            </div>
          </div>
          <Share2 className='text-primary/70 w-5 h-5 hidden sm:block' />
        </div>
      </CardHeader>

      <CardContent className='p-6 space-y-6'>
        {/* Visual Badge Preview */}
        <div className='flex flex-col md:flex-row gap-6 items-center justify-between bg-card p-6 rounded-2xl border border-border/80 shadow-2xs relative overflow-hidden'>
          <div className='absolute -right-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full pointer-events-none blur-2xl' />
          
          <div className='flex-1 text-center md:text-left space-y-1 z-10'>
            <span className='inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider border border-emerald-500/20 mb-2'>
              <Trophy className='w-3 h-3 text-emerald-600 dark:text-emerald-400' />
              Verified Attempt
            </span>
            <p className='text-xl font-extrabold text-foreground tracking-tight'>{assessmentTitle}</p>
            <p className='text-xs font-semibold text-muted-foreground'>
              Completed on <span className='text-foreground'>{completedAt}</span>
            </p>
          </div>

          <div className='flex items-center gap-6 justify-center shrink-0 z-10'>
            <div className='text-center px-4 py-2 bg-muted/40 rounded-xl border border-border/60'>
              <div className='text-2xl font-extrabold text-primary tracking-tight'>
                {score}
                {maxMarks && (
                  <span className='text-sm font-bold text-muted-foreground'>/{maxMarks}</span>
                )}
              </div>
              <div className='text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mt-0.5'>
                Score
              </div>
            </div>

            <div className='text-center px-4 py-2 bg-muted/40 rounded-xl border border-border/60'>
              <div className='text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight'>
                Top {Math.max(1, 100 - Math.round(percentile))}%
              </div>
              <div className='text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mt-0.5'>
                Percentile
              </div>
            </div>

            {rank && (
              <div className='text-center px-4 py-2 bg-muted/40 rounded-xl border border-border/60 hidden sm:block'>
                <div className='text-2xl font-extrabold text-foreground tracking-tight'>#{rank}</div>
                <div className='text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mt-0.5'>
                  Rank
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='flex flex-wrap items-center justify-end gap-3 pt-2'>
          <Button
            variant='outline'
            className='rounded-xl font-bold text-xs bg-card border-border/80 text-foreground px-4 py-2 flex items-center gap-2 hover:bg-muted/50 transition-all'
            onClick={handleCopyLink}
          >
            {copied ? <Check className='w-4 h-4 text-emerald-500' /> : <Copy className='w-4 h-4 text-muted-foreground' />}
            <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
          </Button>

          <Button
            className='rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 flex items-center gap-2 shadow-sm transition-all'
            onClick={handleNativeShare}
          >
            <Share2 className='w-4 h-4' />
            <span>Share Report</span>
          </Button>

          <Button
            variant='ghost'
            size='sm'
            className='rounded-xl font-bold text-xs text-muted-foreground hover:text-foreground px-3 py-2 flex items-center gap-1.5'
            onClick={() => window.print()}
          >
            <Download className='w-3.5 h-3.5' />
            <span>Print Card</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
