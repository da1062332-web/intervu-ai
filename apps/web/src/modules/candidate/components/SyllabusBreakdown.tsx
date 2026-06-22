'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckCircle2 } from 'lucide-react';

interface SyllabusBreakdownProps {
  syllabus?: string[];
}

export function SyllabusBreakdown({ syllabus }: SyllabusBreakdownProps) {
  if (!syllabus || syllabus.length === 0) {
    return null;
  }

  return (
    <Card className='glass-card border border-border/60 shadow-sm'>
      <CardHeader>
        <CardTitle className='text-lg font-bold flex items-center gap-2 text-foreground'>
          <BookOpen className='size-5 text-indigo-500' />
          Syllabus Breakdown
        </CardTitle>
        <CardDescription>Topics and cognitive concepts evaluated in this assessment</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3.5'>
        {syllabus.map((item, idx) => (
          <div key={idx} className='flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-muted/20'>
            <CheckCircle2 className='size-5 text-indigo-500 shrink-0 mt-0.5' />
            <span className='text-sm text-foreground leading-relaxed font-medium'>{item}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
