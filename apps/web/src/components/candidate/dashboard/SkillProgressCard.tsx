import { SkillProgress } from '@/features/candidate/dashboard/types/candidateDashboard.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface SkillProgressCardProps {
  skills: SkillProgress[];
}

export function SkillProgressCard({ skills }: SkillProgressCardProps) {
  return (
    <Card className='h-full flex flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Target className='size-5' />
          Skill Progress
        </CardTitle>
        <CardDescription>Your performance across domains</CardDescription>
      </CardHeader>
      <CardContent className='flex-1'>
        {skills.length === 0 ? (
          <p className='text-sm text-muted-foreground text-center py-4'>
            No skill data available yet.
          </p>
        ) : (
          <div className='space-y-5'>
            {skills.map((skill) => (
              <div key={skill.skill} className='space-y-1.5'>
                <div className='flex justify-between items-center text-sm'>
                  <span className='font-medium'>{skill.skill}</span>
                  <span className='text-muted-foreground'>{skill.score}%</span>
                </div>
                <div className='h-2 w-full bg-muted rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-primary rounded-full transition-all duration-1000 ease-out'
                    style={{ width: `${skill.score}%` }}
                    role='progressbar'
                    aria-valuenow={skill.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
