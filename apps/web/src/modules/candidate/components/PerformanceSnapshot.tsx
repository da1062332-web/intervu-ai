'use client';
import React from 'react';
import { SkillProgress } from '../types/Dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3 } from 'lucide-react';

import { useCandidateDashboard } from '../hooks/useCandidateDashboard';

export const PerformanceSnapshot = React.memo(function PerformanceSnapshot() {
  const { data, isLoading, error } = useCandidateDashboard();

  if (isLoading) {
    return (
      <Card className='h-full glass-card'>
        <CardHeader>
          <CardTitle className='text-lg font-semibold flex items-center gap-2'>
            <BarChart3 className='size-5 text-indigo-500' />
            Performance Snapshot
          </CardTitle>
          <CardDescription>Topic mastery metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='space-y-2'>
                <div className='flex justify-between'>
                  <div className='h-4 w-20 bg-muted animate-pulse rounded'></div>
                  <div className='h-4 w-8 bg-muted animate-pulse rounded'></div>
                </div>
                <div className='h-2 bg-muted animate-pulse rounded'></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className='h-full glass-card'>
        <CardContent className='flex-1 flex items-center justify-center text-destructive'>
          Failed to load performance metrics.
        </CardContent>
      </Card>
    );
  }

  const skills = data.skillProgress;

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
});
