'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListCollapse, Clock, HelpCircle } from 'lucide-react';

interface SectionBreakdownProps {
  sections: string[];
}

export function SectionBreakdown({ sections }: SectionBreakdownProps) {
  if (!sections || sections.length === 0) {
    return null; // hide if not available
  }

  return (
    <Card className='glass-card border border-border/60 shadow-sm'>
      <CardHeader>
        <CardTitle className='text-lg font-bold flex items-center gap-2 text-foreground'>
          <ListCollapse className='size-5 text-indigo-500' />
          Section Breakdown
        </CardTitle>
        <CardDescription>Structure and sectional time allocations</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {sections.map((sectionName, idx) => (
          <div
            key={sectionName || idx}
            className='flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/10 transition-colors'
          >
            <div>
              <p className='font-semibold text-sm text-foreground'>{sectionName}</p>
              <p className='text-xs text-muted-foreground mt-1'>Section {idx + 1}</p>
            </div>
            <div className='flex items-center gap-5 text-sm'>
              <span className='flex items-center gap-1 text-muted-foreground font-medium'>
                <HelpCircle className='size-4 text-violet-500' />
                N/A
              </span>
              <span className='flex items-center gap-1 text-muted-foreground font-medium'>
                <Clock className='size-4 text-emerald-500' />
                N/A
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
