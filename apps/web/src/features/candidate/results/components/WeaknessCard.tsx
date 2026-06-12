import { SkillScore } from '../types/results.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingDown } from 'lucide-react';

interface WeaknessCardProps {
  weaknesses: SkillScore[];
}

export function WeaknessCard({ weaknesses }: WeaknessCardProps) {
  if (!weaknesses || weaknesses.length === 0) return null;

  return (
    <Card className='border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg text-orange-700 dark:text-orange-500'>
          <TrendingDown className='w-5 h-5' />
          Areas for Improvement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className='space-y-3'>
          {weaknesses.map((skill) => (
            <li key={skill.id} className='flex items-start gap-3'>
              <AlertTriangle className='w-5 h-5 text-orange-600 dark:text-orange-500 shrink-0 mt-0.5' />
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
