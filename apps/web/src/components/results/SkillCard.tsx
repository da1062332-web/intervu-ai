import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface SkillCardProps {
  skill: string;
  score: number;
  feedback: string;
}

export function SkillCard({ skill, score, feedback }: SkillCardProps) {
  // Simple color coding logic based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 75) return 'text-amber-600 dark:text-amber-400';
    return 'text-destructive';
  };

  return (
    <Card className='h-full flex flex-col'>
      <CardHeader className='pb-3 flex-row items-center justify-between space-y-0'>
        <CardTitle className='text-base font-semibold truncate pr-4' title={skill}>
          {skill}
        </CardTitle>
        <div className={`font-bold text-lg ${getScoreColor(score)}`}>{score}%</div>
      </CardHeader>
      <CardContent className='flex-1'>
        <p className='text-sm text-muted-foreground leading-relaxed'>{feedback}</p>
      </CardContent>
    </Card>
  );
}
