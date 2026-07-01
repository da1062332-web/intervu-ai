import React, { useState, useCallback, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Target,
  BarChart3,
  Copy,
  RefreshCw,
  Info,
} from 'lucide-react';
import { apiClient } from '@/services/api/client';
import { toast } from 'sonner';

interface SectionBreakdown {
  sectionKey: string;
  valid: boolean;
  questionCount: number;
  expectedQuestionCount: number;
  difficultyAccuracy: number;
  topicAccuracy: number;
  duplicateCount: number;
}

interface HealthReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  coverage: number;
  difficultyAccuracy: number;
  topicAccuracy: number;
  duplicateCount: number;
  sectionBreakdown?: SectionBreakdown[];
}

interface AssemblyHealthDashboardProps {
  assemblyId: string;
}

const ScoreGauge: React.FC<{ value: number; label: string; color: string }> = ({
  value,
  label,
  color,
}) => (
  <div className='flex flex-col gap-1.5'>
    <div className='flex items-center justify-between text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className={`font-bold ${color}`}>{value.toFixed(1)}%</span>
    </div>
    <Progress value={value} className='h-2.5' />
  </div>
);

const StatusIcon: React.FC<{ passed: boolean }> = ({ passed }) =>
  passed ? (
    <CheckCircle2 className='w-4 h-4 text-emerald-500 shrink-0' />
  ) : (
    <XCircle className='w-4 h-4 text-red-500 shrink-0' />
  );

export const AssemblyHealthDashboard: React.FC<AssemblyHealthDashboardProps> = ({ assemblyId }) => {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!assemblyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.request<{ success: boolean; data: HealthReport }>(
        `/assembly/${assemblyId}/health`,
        { method: 'GET', skipErrorToast: true },
      );
      setReport(res.data);
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to load health report';
      setError(msg);
      toast.error('Health check failed', { description: msg });
    } finally {
      setLoading(false);
    }
  }, [assemblyId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const overallScore = report
    ? Math.round((report.coverage + report.difficultyAccuracy + report.topicAccuracy) / 3)
    : 0;

  const scoreColor =
    overallScore >= 90
      ? 'text-emerald-600'
      : overallScore >= 70
        ? 'text-amber-600'
        : 'text-red-600';

  const scoreBg =
    overallScore >= 90
      ? 'bg-emerald-50 border-emerald-200'
      : overallScore >= 70
        ? 'bg-amber-50 border-amber-200'
        : 'bg-red-50 border-red-200';

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-16 gap-4'>
        <div className='w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin' />
        <p className='text-sm text-muted-foreground'>Running health analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-lg border border-red-200 bg-red-50 p-6 text-center'>
        <p className='text-red-700 font-semibold text-sm mb-3'>{error}</p>
        <Button variant='outline' size='sm' onClick={loadReport}>
          <RefreshCw className='w-4 h-4 mr-2' /> Retry
        </Button>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-xl font-semibold flex items-center gap-2'>
            <Activity className='w-5 h-5 text-primary' />
            Assembly Health Dashboard
          </h3>
          <p className='text-sm text-muted-foreground mt-1'>
            V2 validation report — coverage, accuracy, and issue detection
          </p>
        </div>
        <Button variant='outline' size='sm' onClick={loadReport} disabled={loading}>
          <RefreshCw className='w-4 h-4 mr-2' /> Refresh
        </Button>
      </div>

      {/* Overall Score */}
      <div className={`rounded-xl border p-6 flex items-center gap-6 ${scoreBg}`}>
        <div className='text-center min-w-[80px]'>
          <div className={`text-4xl font-black ${scoreColor}`}>{overallScore}</div>
          <div className='text-xs text-muted-foreground mt-1'>/ 100</div>
        </div>
        <div className='flex-1'>
          <div className={`text-lg font-bold mb-1 ${scoreColor}`}>
            {overallScore >= 90
              ? '✅ Excellent'
              : overallScore >= 70
                ? '⚠️ Needs Attention'
                : '❌ Critical Issues'}
          </div>
          <div className='text-sm text-muted-foreground'>
            {report.valid
              ? 'Assembly passed all validations and is ready for publishing.'
              : `Assembly has ${report.errors.length} error(s) that must be resolved before publishing.`}
          </div>
          <div className='flex items-center gap-3 mt-2 text-xs'>
            {report.errors.length > 0 && (
              <span className='text-red-600 font-medium'>{report.errors.length} error(s)</span>
            )}
            {report.warnings.length > 0 && (
              <span className='text-amber-600 font-medium'>
                {report.warnings.length} warning(s)
              </span>
            )}
            {report.duplicateCount > 0 && (
              <span className='text-orange-600 font-medium'>
                {report.duplicateCount} duplicate(s)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Score Gauges */}
      <div className='rounded-lg border bg-card p-5 shadow-sm'>
        <h4 className='font-semibold mb-4 text-sm border-b pb-2 flex items-center gap-2'>
          <Target className='w-4 h-4 text-primary' />
          Accuracy Metrics
        </h4>
        <div className='space-y-4'>
          <ScoreGauge
            value={report.coverage}
            label='Coverage (Questions Allocated)'
            color={
              report.coverage >= 95
                ? 'text-emerald-600'
                : report.coverage >= 80
                  ? 'text-amber-600'
                  : 'text-red-600'
            }
          />
          <ScoreGauge
            value={report.difficultyAccuracy}
            label='Difficulty Distribution Accuracy'
            color={
              report.difficultyAccuracy >= 90
                ? 'text-emerald-600'
                : report.difficultyAccuracy >= 75
                  ? 'text-amber-600'
                  : 'text-red-600'
            }
          />
          <ScoreGauge
            value={report.topicAccuracy}
            label='Topic Distribution Accuracy'
            color={
              report.topicAccuracy >= 90
                ? 'text-emerald-600'
                : report.topicAccuracy >= 75
                  ? 'text-amber-600'
                  : 'text-red-600'
            }
          />
        </div>
      </div>

      {/* Errors */}
      {report.errors.length > 0 && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-5'>
          <h4 className='font-semibold text-sm text-red-700 mb-3 flex items-center gap-2'>
            <XCircle className='w-4 h-4' />
            Validation Errors ({report.errors.length})
          </h4>
          <ul className='space-y-1.5'>
            {report.errors.map((err, i) => (
              <li key={i} className='flex items-start gap-2 text-sm text-red-700'>
                <span className='shrink-0 font-mono text-xs bg-red-100 px-1 py-0.5 rounded mt-0.5'>
                  {err.split(':')[0]}
                </span>
                <span>{err.split(':').slice(1).join(':').trim()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {report.warnings.length > 0 && (
        <div className='rounded-lg border border-amber-200 bg-amber-50 p-5'>
          <h4 className='font-semibold text-sm text-amber-700 mb-3 flex items-center gap-2'>
            <AlertTriangle className='w-4 h-4' />
            Warnings ({report.warnings.length})
          </h4>
          <ul className='space-y-1.5'>
            {report.warnings.map((warn, i) => (
              <li key={i} className='flex items-start gap-2 text-sm text-amber-700'>
                <Info className='w-4 h-4 shrink-0 mt-0.5' />
                <span>{warn}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Duplicates Alert */}
      {report.duplicateCount > 0 && (
        <div className='rounded-lg border border-orange-200 bg-orange-50 p-4 flex items-center gap-3 text-sm text-orange-700'>
          <Copy className='w-4 h-4 shrink-0' />
          <span>
            <strong>{report.duplicateCount}</strong> duplicate question(s) detected in this
            assembly. Run the assembly again to resolve.
          </span>
        </div>
      )}

      {/* Per-Section Breakdown */}
      {report.sectionBreakdown && report.sectionBreakdown.length > 0 && (
        <div className='rounded-lg border bg-card p-5 shadow-sm'>
          <h4 className='font-semibold text-sm border-b pb-2 mb-4 flex items-center gap-2'>
            <BarChart3 className='w-4 h-4 text-primary' />
            Section Breakdown
          </h4>
          <div className='space-y-3'>
            {report.sectionBreakdown.map((section) => (
              <div
                key={section.sectionKey}
                className={`rounded-lg border p-4 ${section.valid ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}
              >
                <div className='flex items-center justify-between mb-2'>
                  <div className='flex items-center gap-2'>
                    <StatusIcon passed={section.valid} />
                    <span className='font-semibold text-sm'>{section.sectionKey}</span>
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {section.questionCount} / {section.expectedQuestionCount} questions
                  </div>
                </div>
                <div className='grid grid-cols-3 gap-3 text-xs text-muted-foreground'>
                  <div>
                    Difficulty:{' '}
                    <span className='font-semibold text-foreground'>
                      {section.difficultyAccuracy}%
                    </span>
                  </div>
                  <div>
                    Topic:{' '}
                    <span className='font-semibold text-foreground'>{section.topicAccuracy}%</span>
                  </div>
                  <div>
                    Duplicates:{' '}
                    <span
                      className={`font-semibold ${section.duplicateCount > 0 ? 'text-orange-600' : 'text-emerald-600'}`}
                    >
                      {section.duplicateCount}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
