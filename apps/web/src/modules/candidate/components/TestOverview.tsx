'use client';

import { TestConfig } from '@/features/candidate/tests/types/test.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, HelpCircle, Building } from 'lucide-react';

interface TestOverviewProps {
  test: TestConfig;
}

export function TestOverview({ test }: TestOverviewProps) {
  const difficultyColors: Record<string, string> = {
    Easy: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Hard: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };

  return (
    <Card className='glass-card border border-border/60 shadow-sm relative overflow-hidden'>
      <CardHeader className='pb-4'>
        <div className='flex justify-between items-start gap-4'>
          <div>
            {test.company && (
              <div className='flex items-center gap-2 mb-2 text-muted-foreground text-sm font-semibold'>
                <Building className='size-4 text-primary' />
                <span>{test.company}</span>
              </div>
            )}
            <CardTitle className='text-2xl font-bold tracking-tight text-foreground'>
              {test.title}
            </CardTitle>
          </div>
          <Badge
            variant='outline'
            className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 ${difficultyColors[test.difficulty] || ''}`}
          >
            {test.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='flex items-center gap-6 pt-4 pb-6 border-t border-border/20 bg-muted/10'>
        <div className='flex items-center gap-2 text-muted-foreground font-medium text-sm'>
          <HelpCircle className='size-5 text-primary/70' />
          <span>Questions count not available</span>
        </div>
        {test.durationMinutes && (
          <div className='flex items-center gap-2 text-muted-foreground font-medium text-sm'>
            <Clock className='size-5 text-primary/70' />
            <span>
              <strong className='text-foreground'>{test.durationMinutes}</strong> Minutes
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
