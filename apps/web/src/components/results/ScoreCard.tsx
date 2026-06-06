import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ScoreCardProps {
  overallScore: number;
  confidenceScore: number;
}

export function ScoreCard({ overallScore, confidenceScore }: ScoreCardProps) {
  return (
    <section className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8' aria-label='Score Overview'>
      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
            Overall Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-4xl font-bold text-foreground'>
            {overallScore}
            <span className='text-2xl text-muted-foreground'>/100</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='pb-2'>
          <CardTitle className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
            Confidence Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-4xl font-bold text-foreground'>
            {confidenceScore}
            <span className='text-2xl text-muted-foreground'>%</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
