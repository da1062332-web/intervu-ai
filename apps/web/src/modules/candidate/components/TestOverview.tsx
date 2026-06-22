'use client';

import { Test } from '../types/Test';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, HelpCircle, Building, AlertCircle } from 'lucide-react';

interface TestOverviewProps {
  test: Test;
}

export function TestOverview({ test }: TestOverviewProps) {
  const difficultyColors = {
    Easy: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Hard: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };

  return (
    <Card className='h-full flex flex-col glass-card border border-border/60 shadow-sm relative overflow-hidden'>
      <CardHeader className='pb-4'>
        <div className='flex justify-between items-start gap-4'>
          <div>
            <div className='flex items-center gap-2 mb-2 text-muted-foreground text-sm font-semibold'>
              <Building className='size-4 text-primary' />
              <span>{test.company}</span>
            </div>
            <CardTitle className='text-2xl font-bold tracking-tight text-foreground'>
              {test.title}
            </CardTitle>
          </div>
          <Badge variant='outline' className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 ${difficultyColors[test.difficulty]}`}>
            {test.difficulty}
          </Badge>
        </div>
        <CardDescription className='mt-4 text-base text-muted-foreground leading-relaxed'>
          {test.description}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex gap-6 mt-4 pb-6 pt-0 border-t border-border/20 py-4 bg-muted/10'>
        <div className='flex items-center gap-2 text-muted-foreground font-medium text-sm'>
          <HelpCircle className='size-5 text-primary/70' />
          <span><strong className='text-foreground'>{test.totalQuestions}</strong> Questions</span>
        </div>
        <div className='flex items-center gap-2 text-muted-foreground font-medium text-sm'>
          <Clock className='size-5 text-primary/70' />
          <span><strong className='text-foreground'>{test.durationMinutes}</strong> Minutes</span>
        </div>
      </CardContent>
    </Card>
  );
}
