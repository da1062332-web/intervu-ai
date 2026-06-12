import { SkillScore } from '../types/results.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, TrendingUp } from 'lucide-react';

interface StrengthCardProps {
  strengths: SkillScore[];
}

export function StrengthCard({ strengths }: StrengthCardProps) {
  if (!strengths || strengths.length === 0) return null;

  return (
    <Card className='border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg text-green-700 dark:text-green-500'>
          <TrendingUp className='w-5 h-5' />
          Key Strengths
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className='space-y-3'>
          {strengths.map((skill) => (
            <li key={skill.id} className='flex items-start gap-3'>
              <CheckCircle2 className='w-5 h-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5' />
              <div>
                <p className='font-semibold text-foreground'>
                  {skill.name} ({skill.score}%)
                </p>
                <p className='text-sm text-muted-foreground mt-0.5'>{skill.feedback}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
