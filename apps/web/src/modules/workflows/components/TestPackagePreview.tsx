import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  BookOpen,
  Clock,
  Hash,
  ChevronDown,
  ChevronRight,
  Layers,
  Brain,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/services/api/client';
import { toast } from 'sonner';

interface ExecutionQuestion {
  questionId: string;
  questionOrder: number;
  questionText: string;
  questionType: string;
  difficulty: string;
  topicId: string;
}

interface ExecutionSection {
  sectionKey: string;
  displayName: string;
  durationSeconds: number;
  questionCount: number;
  orderIndex: number;
  questions: ExecutionQuestion[];
}

interface ScoringRules {
  negativeMarkingEnabled: boolean;
  sectionLockingEnabled: boolean;
  shuffleQuestionsEnabled: boolean;
  shuffleOptionsEnabled: boolean;
  allowNavigation: boolean;
}

interface ExecutionPackage {
  assemblyId: string;
  configId: string;
  totalDurationSeconds: number;
  totalQuestions: number;
  scoringRules: ScoringRules;
  sections: ExecutionSection[];
  packagedAt: string;
  assemblyStatus: string;
}

interface TestPackagePreviewProps {
  assemblyId: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'text-emerald-600 bg-emerald-50',
  MEDIUM: 'text-amber-600 bg-amber-50',
  HARD: 'text-red-600 bg-red-50',
};

const difficultyCount = (questions: ExecutionQuestion[], level: string) =>
  questions.filter((q) => q.difficulty === level).length;

export const TestPackagePreview: React.FC<TestPackagePreviewProps> = ({ assemblyId }) => {
  const [pkg, setPkg] = useState<ExecutionPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const loadPackage = useCallback(async () => {
    if (!assemblyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.request<ExecutionPackage>(`/assembly/package/${assemblyId}`, {
        method: 'POST',
        skipErrorToast: true,
      });
      setPkg(res);
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to generate test package';
      setError(msg);
      toast.error('Package generation failed', { description: msg });
    } finally {
      setLoading(false);
    }
  }, [assemblyId]);

  useEffect(() => {
    loadPackage();
  }, [loadPackage]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const allQuestions = pkg?.sections.flatMap((s) => s.questions) ?? [];

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-16 gap-4'>
        <div className='w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin' />
        <p className='text-sm text-muted-foreground'>Generating execution package...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-lg border border-red-200 bg-red-50 p-6 text-center'>
        <p className='text-red-700 font-semibold text-sm mb-3'>{error}</p>
        <Button variant='outline' size='sm' onClick={loadPackage}>
          <RefreshCw className='w-4 h-4 mr-2' /> Retry
        </Button>
      </div>
    );
  }

  if (!pkg) return null;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-xl font-semibold flex items-center gap-2'>
            <Package className='w-5 h-5 text-primary' />
            Test Package Preview
          </h3>
          <p className='text-sm text-muted-foreground mt-1'>
            Execution-ready package. This is what Module 4 receives.
          </p>
        </div>
        <Button variant='outline' size='sm' onClick={loadPackage} disabled={loading}>
          <RefreshCw className='w-4 h-4 mr-2' /> Refresh
        </Button>
      </div>

      {/* Metadata Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <div className='rounded-lg border bg-card p-4 text-center shadow-sm'>
          <div className='text-2xl font-bold text-primary'>{pkg.sections.length}</div>
          <div className='text-xs text-muted-foreground mt-1'>Sections</div>
        </div>
        <div className='rounded-lg border bg-card p-4 text-center shadow-sm'>
          <div className='text-2xl font-bold text-primary'>{pkg.totalQuestions}</div>
          <div className='text-xs text-muted-foreground mt-1'>Total Questions</div>
        </div>
        <div className='rounded-lg border bg-card p-4 text-center shadow-sm'>
          <div className='text-2xl font-bold text-primary'>
            {Math.round(pkg.totalDurationSeconds / 60)} min
          </div>
          <div className='text-xs text-muted-foreground mt-1'>Duration</div>
        </div>
        <div className='rounded-lg border bg-card p-4 text-center shadow-sm'>
          <div
            className={`text-sm font-bold px-2 py-1 rounded-full inline-block ${
              pkg.assemblyStatus === 'PUBLISHED'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {pkg.assemblyStatus}
          </div>
          <div className='text-xs text-muted-foreground mt-1'>Status</div>
        </div>
      </div>

      {/* Difficulty Distribution */}
      <div className='rounded-lg border bg-card p-5 shadow-sm'>
        <h4 className='font-semibold mb-4 flex items-center gap-2 text-sm border-b pb-2'>
          <BarChart3 className='w-4 h-4 text-primary' />
          Overall Difficulty Distribution
        </h4>
        <div className='grid grid-cols-3 gap-4'>
          {(['EASY', 'MEDIUM', 'HARD'] as const).map((level) => {
            const count = difficultyCount(allQuestions, level);
            const pct = pkg.totalQuestions > 0 ? Math.round((count / pkg.totalQuestions) * 100) : 0;
            return (
              <div key={level} className='flex flex-col gap-1'>
                <div className='flex justify-between text-xs'>
                  <span
                    className={`font-medium px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[level]}`}
                  >
                    {level}
                  </span>
                  <span className='text-muted-foreground font-medium'>{count}</span>
                </div>
                <Progress value={pct} className='h-2' />
                <div className='text-xs text-right text-muted-foreground'>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scoring Rules */}
      <div className='rounded-lg border bg-card p-5 shadow-sm'>
        <h4 className='font-semibold mb-3 flex items-center gap-2 text-sm border-b pb-2'>
          <Brain className='w-4 h-4 text-primary' />
          Scoring Rules
        </h4>
        <div className='grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'>
          {[
            { label: 'Negative Marking', value: pkg.scoringRules.negativeMarkingEnabled },
            { label: 'Section Locking', value: pkg.scoringRules.sectionLockingEnabled },
            { label: 'Shuffle Questions', value: pkg.scoringRules.shuffleQuestionsEnabled },
            { label: 'Shuffle Options', value: pkg.scoringRules.shuffleOptionsEnabled },
            { label: 'Allow Navigation', value: pkg.scoringRules.allowNavigation },
          ].map((rule) => (
            <div
              key={rule.label}
              className='flex items-center justify-between border rounded-md px-3 py-2'
            >
              <span className='text-muted-foreground'>{rule.label}</span>
              <span
                className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                  rule.value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {rule.value ? 'ON' : 'OFF'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sections (collapsible) */}
      <div className='space-y-3'>
        <h4 className='font-semibold flex items-center gap-2 text-sm'>
          <Layers className='w-4 h-4 text-primary' />
          Sections ({pkg.sections.length})
        </h4>
        {pkg.sections.map((section) => {
          const isExpanded = expandedSections.has(section.sectionKey);
          return (
            <div
              key={section.sectionKey}
              className='rounded-lg border bg-card shadow-sm overflow-hidden'
            >
              <button
                className='w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors'
                onClick={() => toggleSection(section.sectionKey)}
                aria-expanded={isExpanded}
                id={`section-toggle-${section.sectionKey}`}
              >
                <div className='flex items-center gap-3'>
                  {isExpanded ? (
                    <ChevronDown className='w-4 h-4 text-muted-foreground' />
                  ) : (
                    <ChevronRight className='w-4 h-4 text-muted-foreground' />
                  )}
                  <div className='text-left'>
                    <div className='font-semibold text-sm'>{section.displayName}</div>
                    <div className='text-xs text-muted-foreground'>{section.sectionKey}</div>
                  </div>
                </div>
                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                  <span className='flex items-center gap-1'>
                    <Hash className='w-3 h-3' />
                    {section.questionCount} Qs
                  </span>
                  <span className='flex items-center gap-1'>
                    <Clock className='w-3 h-3' />
                    {Math.round(section.durationSeconds / 60)} min
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className='border-t divide-y'>
                  {section.questions.map((q) => (
                    <div
                      key={q.questionId}
                      className='flex items-start gap-4 px-5 py-3 text-sm hover:bg-muted/10 transition-colors'
                    >
                      <div className='text-muted-foreground font-mono w-8 shrink-0 pt-0.5'>
                        {q.questionOrder}.
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='line-clamp-2 leading-relaxed'>
                          {q.questionText || '(No question text in snapshot)'}
                        </p>
                        <div className='flex items-center gap-2 mt-1'>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[q.difficulty] ?? 'bg-muted text-muted-foreground'}`}
                          >
                            {q.difficulty}
                          </span>
                          <span className='text-xs text-muted-foreground'>{q.questionType}</span>
                          {q.topicId && (
                            <span className='text-xs text-muted-foreground flex items-center gap-0.5'>
                              <BookOpen className='w-3 h-3' /> {q.topicId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className='text-xs text-muted-foreground text-right'>
        Packaged at: {new Date(pkg.packagedAt).toLocaleString()}
        {' · '}Assembly: <span className='font-mono'>{pkg.assemblyId.slice(0, 12)}…</span>
      </div>
    </div>
  );
};
