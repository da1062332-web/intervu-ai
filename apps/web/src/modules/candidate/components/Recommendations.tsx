'use client';

import { CandidateRecommendations } from '../types/Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, Target } from 'lucide-react';

interface RecommendationsProps {
  recommendations: CandidateRecommendations | null;
}

export function Recommendations({ recommendations }: RecommendationsProps) {
  if (!recommendations) {
    return (
      <Card className='h-full glass-card'>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className='size-5 text-yellow-500' />
            Personalized Guidance
          </CardTitle>
          <CardDescription>Recommendations will appear once you complete a test</CardDescription>
        </CardHeader>
        <CardContent className='text-sm text-muted-foreground p-6 text-center'>
          Take your first assessment to receive custom suggestions.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full glass-card border border-primary/20 shadow-md relative overflow-hidden'>
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -z-10" />
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className='size-5 text-indigo-500 animate-pulse' />
          AI Recommendations
        </CardTitle>
        <CardDescription>Based on your performance trend</CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-2 gap-4'>
          <div className='bg-primary/5 border border-primary/10 rounded-xl p-4 flex flex-col items-center justify-center text-center'>
            <TrendingUp className='size-5 text-primary mb-1.5' />
            <span className='text-2xl font-bold text-foreground'>{recommendations.overallScore}%</span>
            <span className='text-[10px] uppercase tracking-wider text-muted-foreground mt-1'>Avg Score</span>
          </div>
          <div className='bg-violet-500/5 border border-violet-500/10 rounded-xl p-4 flex flex-col items-center justify-center text-center'>
            <Target className='size-5 text-violet-500 mb-1.5' />
            <span className='text-2xl font-bold text-foreground'>{recommendations.confidenceScore}%</span>
            <span className='text-[10px] uppercase tracking-wider text-muted-foreground mt-1'>Confidence</span>
          </div>
        </div>

        <div className='bg-muted/40 border border-border/50 rounded-xl p-4'>
          <p className='text-sm text-foreground font-medium mb-1'>Suggested focus area:</p>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            {recommendations.recommendationSummary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
