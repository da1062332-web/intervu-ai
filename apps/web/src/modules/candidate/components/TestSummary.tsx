'use client';

import { Test } from '../types/Test';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, HelpCircle, FileText, Sparkles } from 'lucide-react';

interface TestSummaryProps {
  test: Test;
}

export function TestSummary({ test }: TestSummaryProps) {
  const difficultyColors = {
    Easy: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Hard: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };

  return (
    <Card className='glass-card border border-border/60 shadow-sm relative overflow-hidden'>
      <div className='absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10' />
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg font-bold flex items-center gap-2 text-foreground'>
          <FileText className='size-5 text-indigo-500' />
          Test Config Summary
        </CardTitle>
        <CardDescription>Assessment parameters</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-start justify-between p-3 rounded-lg border border-border/30 bg-muted/20'>
          <div>
            <h4 className='text-sm font-bold text-foreground leading-snug'>{test.title}</h4>
            <p className='text-xs text-muted-foreground mt-1'>{test.company}</p>
          </div>
          <Badge variant='outline' className={`text-[9px] uppercase font-bold tracking-wider ${difficultyColors[test.difficulty]}`}>
            {test.difficulty}
          </Badge>
        </div>

        <div className='grid grid-cols-2 gap-3.5'>
          <div className='p-3 border border-border/30 bg-card rounded-lg flex items-center gap-2.5'>
            <Clock className='size-5 text-indigo-500' />
            <div>
              <p className='text-[10px] text-muted-foreground font-semibold uppercase tracking-wider'>Duration</p>
              <p className='text-sm font-bold text-foreground mt-0.5'>{test.durationMinutes} Minutes</p>
            </div>
          </div>

          <div className='p-3 border border-border/30 bg-card rounded-lg flex items-center gap-2.5'>
            <HelpCircle className='size-5 text-indigo-500' />
            <div>
              <p className='text-[10px] text-muted-foreground font-semibold uppercase tracking-wider'>Questions</p>
              <p className='text-sm font-bold text-foreground mt-0.5'>{test.totalQuestions} Questions</p>
            </div>
          </div>
        </div>

        <div className='p-3 border border-border/30 bg-card rounded-lg flex items-center gap-2.5'>
          <Sparkles className='size-5 text-violet-500' />
          <div>
            <p className='text-[10px] text-muted-foreground font-semibold uppercase tracking-wider'>Sections</p>
            <p className='text-sm font-bold text-foreground mt-0.5'>
              {test.sections.length} Parts ({test.sections.map((s) => s.name).join(', ')})
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
