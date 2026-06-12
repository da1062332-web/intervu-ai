import { SkillScore } from '../types/results.types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BrainCircuit } from 'lucide-react';

interface SkillBreakdownCardProps {
  skills: SkillScore[];
}

export function SkillBreakdownCard({ skills }: SkillBreakdownCardProps) {
  if (!skills || skills.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <BrainCircuit className='w-5 h-5 text-muted-foreground' />
          Skill Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {skills.map((skill) => (
          <div key={skill.id} className='space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='font-medium'>{skill.name}</span>
              <span className='text-sm font-bold'>{skill.score}%</span>
            </div>
            <Progress value={skill.score} className='h-2' />
            <p className='text-sm text-muted-foreground pt-1'>{skill.feedback}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
