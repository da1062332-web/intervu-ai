'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  Filter,
  Layers,
  AlertCircle,
  EyeOff,
  Search,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { apiClient } from '@/services/api/client';

export interface BankAnalyticsData {
  questionsByTopic: Array<{ topic: string; count: number }>;
  questionsByDifficulty: Array<{ difficulty: string; count: number }>;
  questionsByStatus: Array<{ status: string; count: number }>;
  questionsBySource: Array<{ source: string; count: number }>;
}

export interface ContentCoverageData {
  missingTopics: string[];
  lowCoverageTopics: Array<{ topic: string; count: number; required: number }>;
  difficultyGaps: Array<{ topic: string; missingDifficulties: string[] }>;
  unusedQuestions: Array<{ id: string; questionText: string; topic: string; difficulty: string }>;
}

export function QuestionBankAnalyticsPage() {
  const [bankData, setBankData] = useState<BankAnalyticsData | null>(null);
  const [coverageData, setCoverageData] = useState<ContentCoverageData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterTopic, setFilterTopic] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bankRes, coverageRes] = await Promise.all([
          apiClient.request<BankAnalyticsData>('/admin/analytics/question-bank'),
          apiClient.request<ContentCoverageData>('/admin/content-coverage'),
        ]);
        setBankData(bankRes);
        setCoverageData(coverageRes);
      } catch (error) {
        console.error('Failed to load bank analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtered Unused Questions based on UI select filters
  const filteredUnused =
    coverageData?.unusedQuestions.filter((q) => {
      const matchTopic =
        filterTopic === '' || q.topic.toLowerCase().includes(filterTopic.toLowerCase());
      const matchDiff = filterDifficulty === '' || q.difficulty === filterDifficulty;
      return matchTopic && matchDiff;
    }) ?? [];

  const maxTopicVal =
    bankData?.questionsByTopic && bankData.questionsByTopic.length > 0
      ? Math.max(...bankData.questionsByTopic.map((t) => t.count))
      : 1;

  return (
    <div className='space-y-8 animate-fade-in-up pb-8'>
      {/* Page Header */}
      <SectionHeader
        title='Question Bank Register'
        description='Observe the scale and health of our question pools, difficulty balance, and coverage deficiencies.'
        actions={
          <Button asChild variant='outline'>
            <Link href='/admin/dashboard'>
              <ArrowLeft className='size-4 mr-2' />
              Back to Dashboard
            </Link>
          </Button>
        }
      />

      {loading ? (
        <div className='flex justify-center items-center py-12'>
          <Loader2 className='size-8 animate-spin text-muted-foreground' />
        </div>
      ) : (
        <>
          {/* Main Gaps & Content Coverage warnings */}
          <section className='grid gap-6 md:grid-cols-2'>
            {/* Gaps alert box */}
            <Card className='glass border border-red-500/20 shadow-lg bg-red-500/[0.02]'>
              <CardHeader>
                <CardTitle className='text-md font-heading font-semibold text-red-600 dark:text-red-400 flex items-center gap-2'>
                  <AlertCircle className='size-5' />
                  Syllabus Coverage Gaps
                </CardTitle>
                <CardDescription>
                  Urgent warnings concerning topics and difficulties that lack questions.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 pt-4 border-t border-red-500/10'>
                {coverageData?.missingTopics.length === 0 &&
                coverageData?.difficultyGaps.length === 0 ? (
                  <div className='text-sm text-muted-foreground text-center py-6'>
                    🎉 No coverage gaps detected! All syllabus entries populated.
                  </div>
                ) : (
                  <>
                    {coverageData?.missingTopics.map((topic, idx) => (
                      <div
                        key={idx}
                        className='p-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-center gap-2'
                      >
                        <span className='font-semibold uppercase tracking-wider text-[10px] bg-red-500/25 px-1.5 py-0.5 rounded'>
                          Topic Gap
                        </span>
                        Topic <strong>{topic}</strong> has <strong>0</strong> questions in the
                        registry.
                      </div>
                    ))}
                    {coverageData?.difficultyGaps.map((gap, idx) => (
                      <div
                        key={idx}
                        className='p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl text-sm flex items-center gap-2'
                      >
                        <span className='font-semibold uppercase tracking-wider text-[10px] bg-amber-500/25 px-1.5 py-0.5 rounded'>
                          Difficulty Gap
                        </span>
                        Topic <strong>{gap.topic}</strong> lacks questions for:{' '}
                        <strong>{gap.missingDifficulties.join(', ')}</strong>.
                      </div>
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Low inventory coverage warnings */}
            <Card className='glass border border-amber-500/20 shadow-lg bg-amber-500/[0.02]'>
              <CardHeader>
                <CardTitle className='text-md font-heading font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2'>
                  <AlertCircle className='size-5' />
                  Low Coverage Areas
                </CardTitle>
                <CardDescription>
                  Active topics that have less than 10 approved questions in the database.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3 pt-4 border-t border-amber-500/10 max-h-[220px] overflow-y-auto'>
                {coverageData?.lowCoverageTopics.length === 0 ? (
                  <div className='text-sm text-muted-foreground text-center py-6'>
                    🎉 All active topics satisfy coverage requirements.
                  </div>
                ) : (
                  coverageData?.lowCoverageTopics.map((t, idx) => (
                    <div
                      key={idx}
                      className='flex items-center justify-between border-b border-border/30 pb-2 last:border-0 last:pb-0'
                    >
                      <span className='text-sm font-semibold text-foreground truncate w-1/2'>
                        {t.topic}
                      </span>
                      <div className='flex items-center gap-3 w-1/2 justify-end'>
                        <span className='text-xs text-muted-foreground font-medium'>
                          {t.count} / {t.required} count
                        </span>
                        <div className='w-20 h-2 bg-muted rounded-full overflow-hidden'>
                          <div
                            className='h-full bg-amber-500 rounded-full'
                            style={{ width: `${(t.count / t.required) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          {/* Aggregates Breakdown section */}
          <section className='grid gap-6 md:grid-cols-3'>
            {/* Status Breakdown */}
            <Card className='glass border border-border shadow-md'>
              <CardHeader>
                <CardTitle className='text-sm font-heading font-semibold text-foreground flex items-center gap-2'>
                  <Layers className='size-4 text-indigo-500' />
                  Question Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4 pt-4 border-t border-border/40'>
                {bankData?.questionsByStatus.map((s, idx) => (
                  <div
                    key={idx}
                    className='flex items-center justify-between border-b border-border/20 pb-2.5 last:border-0 last:pb-0'
                  >
                    <span className='text-sm text-foreground font-semibold uppercase tracking-wider text-[11px]'>
                      {s.status}
                    </span>
                    <span className='text-sm text-muted-foreground font-bold'>{s.count} items</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Source Breakdown */}
            <Card className='glass border border-border shadow-md'>
              <CardHeader>
                <CardTitle className='text-sm font-heading font-semibold text-foreground flex items-center gap-2'>
                  <Database className='size-4 text-emerald-500' />
                  Sourcing Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4 pt-4 border-t border-border/40'>
                {bankData?.questionsBySource.map((s, idx) => (
                  <div
                    key={idx}
                    className='flex items-center justify-between border-b border-border/20 pb-2.5 last:border-0 last:pb-0'
                  >
                    <span className='text-sm text-foreground font-semibold uppercase tracking-wider text-[11px]'>
                      {s.source}
                    </span>
                    <span className='text-sm text-muted-foreground font-bold'>{s.count} items</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Topic volume summary */}
            <Card className='glass border border-border shadow-md'>
              <CardHeader>
                <CardTitle className='text-sm font-heading font-semibold text-foreground flex items-center gap-2'>
                  <Search className='size-4 text-blue-500' />
                  Topic Densities
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3 pt-4 border-t border-border/40 max-h-[195px] overflow-y-auto'>
                {bankData?.questionsByTopic.map((t, idx) => (
                  <div
                    key={idx}
                    className='flex items-center justify-between border-b border-border/20 pb-2 last:border-0 last:pb-0'
                  >
                    <span className='text-sm text-foreground truncate w-2/3 font-medium'>
                      {t.topic}
                    </span>
                    <div className='flex items-center gap-2 w-1/3 justify-end'>
                      <span className='text-xs font-bold text-muted-foreground'>{t.count}</span>
                      <div className='w-12 h-1.5 bg-muted rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-primary rounded-full'
                          style={{ width: `${(t.count / maxTopicVal) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Filtering and Unused list table */}
          <Card className='glass border border-border shadow-lg'>
            <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/40'>
              <div>
                <CardTitle className='text-lg font-heading font-semibold text-foreground flex items-center gap-2'>
                  <EyeOff className='size-5 text-indigo-500' />
                  Unused Question Registry
                </CardTitle>
                <CardDescription>
                  Active questions in the pool that have not yet been assigned to any candidate
                  tests.
                </CardDescription>
              </div>

              {/* Filtering Controls */}
              <div className='flex items-center gap-3 flex-wrap'>
                <div className='flex items-center gap-2 border border-input rounded-lg px-2.5 py-1.5 bg-background'>
                  <Filter className='size-4 text-muted-foreground' />
                  <input
                    type='text'
                    placeholder='Filter Topic...'
                    value={filterTopic}
                    onChange={(e) => setFilterTopic(e.target.value)}
                    className='bg-transparent text-xs text-foreground focus:outline-none placeholder-muted-foreground w-[120px]'
                  />
                </div>

                <select
                  value={filterDifficulty}
                  onChange={(e) => setFilterDifficulty(e.target.value)}
                  className='border border-input rounded-lg px-2.5 py-1.5 bg-background text-xs text-foreground focus:outline-none'
                >
                  <option value=''>All Difficulties</option>
                  <option value='EASY'>Easy</option>
                  <option value='MEDIUM'>Medium</option>
                  <option value='HARD'>Hard</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className='p-0'>
              {filteredUnused.length === 0 ? (
                <div className='text-sm text-muted-foreground text-center py-12'>
                  No unused questions matching selected filter filters.
                </div>
              ) : (
                <div className='overflow-x-auto w-full'>
                  <table className='w-full text-sm text-left border-collapse'>
                    <thead>
                      <tr className='border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                        <th className='p-3.5 text-left'>Question Context</th>
                        <th className='p-3.5 text-left'>Topic</th>
                        <th className='p-3.5 text-left'>Difficulty</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border/50 bg-card/25'>
                      {filteredUnused.slice(0, 15).map((q) => (
                        <tr key={q.id} className='hover:bg-muted/30 transition-colors'>
                          <td
                            className='p-3.5 font-medium text-foreground max-w-[400px] truncate'
                            title={q.questionText}
                          >
                            {q.questionText}
                          </td>
                          <td className='p-3.5 text-muted-foreground text-sm'>{q.topic}</td>
                          <td className='p-3.5'>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                q.difficulty === 'EASY'
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : q.difficulty === 'MEDIUM'
                                    ? 'bg-blue-500/10 text-blue-500'
                                    : 'bg-red-500/10 text-red-500'
                              }`}
                            >
                              {q.difficulty}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
