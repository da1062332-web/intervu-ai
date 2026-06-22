'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, ShieldAlert } from 'lucide-react';

interface EligibilityInfoProps {
  eligibility?: string[];
}

export function EligibilityInfo({ eligibility }: EligibilityInfoProps) {
  if (!eligibility || eligibility.length === 0) {
    return null;
  }

  return (
    <Card className='glass-card border border-border/60 shadow-sm'>
      <CardHeader>
        <CardTitle className='text-lg font-bold flex items-center gap-2 text-foreground'>
          <UserCheck className='size-5 text-indigo-500' />
          Eligibility Criteria
        </CardTitle>
        <CardDescription>Academic and system compliance requirements</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3.5'>
        {eligibility.map((item, idx) => (
          <div key={idx} className='flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-muted/20'>
            <ShieldAlert className='size-5 text-amber-500 shrink-0 mt-0.5' />
            <span className='text-sm text-foreground leading-relaxed font-medium'>{item}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
