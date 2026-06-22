'use client';

import { SkillProgress } from '../types/Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';

interface PerformanceSnapshotProps {
  skills: SkillProgress[];
}

export function PerformanceSnapshot({ skills }: PerformanceSnapshotProps) {
  return (
    <Card className='h-full glass-card'>
      <CardHeader>
        <CardTitle className='text-lg font-semibold flex items-center gap-2'>
          <BarChart3 className='size-5 text-indigo-500' />
          Performance Snapshot
        </CardTitle>
        <CardDescription>Topic mastery metrics</CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>
        {skills.length === 0 ? (
          <p className='text-sm text-muted-foreground text-center py-4'>
            No skill metrics recorded yet.
          </p>
        ) : (
          skills.map((skill) => (
            <div key={skill.skill} className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span className='font-medium text-foreground'>{skill.skill}</span>
                <span className='font-semibold text-muted-foreground'>{skill.score}%</span>
              </div>
              <Progress value={skill.score} className='h-2 bg-muted' />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
