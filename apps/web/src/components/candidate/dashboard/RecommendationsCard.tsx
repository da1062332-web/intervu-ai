import { CandidateRecommendations } from '@/features/candidate/dashboard/types/candidateDashboard.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Percent, TrendingUp } from 'lucide-react';

interface RecommendationsCardProps {
  recommendations: CandidateRecommendations | null;
}

export function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  if (!recommendations) {
    return (
      <Card className='h-full flex flex-col'>
        <CardHeader>
          <CardTitle>Results & Recommendations</CardTitle>
          <CardDescription>Your overall performance analysis</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 flex items-center justify-center'>
          <p className='text-sm text-muted-foreground'>
            Complete an assessment to see recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='h-full flex flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Lightbulb className='size-5 text-yellow-500' />
          Results & Recommendations
        </CardTitle>
        <CardDescription>Based on your latest assessments</CardDescription>
      </CardHeader>
      <CardContent className='flex-1 space-y-6'>
        <div className='grid grid-cols-2 gap-4'>
          <div className='bg-primary/5 p-4 rounded-lg border border-primary/10 flex flex-col items-center justify-center text-center'>
            <div className='flex items-center gap-1 text-muted-foreground mb-1 text-sm'>
              <Percent className='size-3' />
              Overall Score
            </div>
            <div className='text-3xl font-bold text-primary'>{recommendations.overallScore}%</div>
          </div>
          <div className='bg-primary/5 p-4 rounded-lg border border-primary/10 flex flex-col items-center justify-center text-center'>
            <div className='flex items-center gap-1 text-muted-foreground mb-1 text-sm'>
              <TrendingUp className='size-3' />
              Confidence
            </div>
            <div className='text-3xl font-bold text-primary'>
              {recommendations.confidenceScore}%
            </div>
          </div>
        </div>

        <div className='bg-muted/30 p-4 rounded-lg border border-border/50'>
          <h4 className='text-sm font-semibold mb-2 flex items-center gap-2'>
            <Lightbulb className='size-4 text-yellow-500' />
            Recommended Action
          </h4>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            {recommendations.recommendationSummary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
