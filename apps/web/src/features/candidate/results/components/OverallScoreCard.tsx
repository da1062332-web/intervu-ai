import { EvaluationResult } from '../types/results.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, Target, CheckCircle2 } from 'lucide-react';

interface OverallScoreCardProps {
  evaluation: EvaluationResult;
}

export function OverallScoreCard({ evaluation }: OverallScoreCardProps) {
  return (
    <Card className='bg-primary/5 border-primary/20'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg text-primary'>
          <Trophy className='w-5 h-5' />
          Overall Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
          <div className='flex flex-col'>
            <span className='text-sm font-medium text-muted-foreground mb-1'>Total Score</span>
            <div className='flex items-end gap-1'>
              <span className='text-4xl font-black text-primary'>{evaluation.overallScore}</span>
              <span className='text-lg text-primary/70 pb-1'>%</span>
            </div>
          </div>

          <div className='flex flex-col'>
            <span className='text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5'>
              <Target className='w-3.5 h-3.5' /> Confidence
            </span>
            <div className='flex items-end gap-1'>
              <span className='text-3xl font-bold text-foreground'>
                {evaluation.confidenceScore}
              </span>
              <span className='text-base text-muted-foreground pb-1'>%</span>
            </div>
          </div>

          <div className='flex flex-col'>
            <span className='text-sm font-medium text-muted-foreground mb-1'>Questions</span>
            <span className='text-3xl font-bold text-foreground'>{evaluation.totalQuestions}</span>
          </div>

          <div className='flex flex-col'>
            <span className='text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5'>
              <CheckCircle2 className='w-3.5 h-3.5' /> Correct
            </span>
            <div className='flex items-end gap-2'>
              <span className='text-3xl font-bold text-green-600 dark:text-green-500'>
                {evaluation.correctAnswers}
              </span>
              <span className='text-sm font-semibold text-muted-foreground pb-1 bg-muted px-2 py-0.5 rounded-full'>
                {evaluation.totalQuestions > 0
                  ? Math.round((evaluation.correctAnswers / evaluation.totalQuestions) * 100)
                  : 0}
                % Accuracy
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
