import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, HelpCircle } from 'lucide-react';
import { TestSection } from '../types/test.types';

export function TestMetadata({ sections }: { sections: TestSection[] }) {
  return (
    <Card className='h-full flex flex-col'>
      <CardHeader>
        <CardTitle>Section Breakdown</CardTitle>
      </CardHeader>
      <CardContent className='flex-1 space-y-4'>
        {sections.map((section) => (
          <div
            key={section.id}
            className='flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors gap-4'
          >
            <h3 className='font-medium text-foreground'>{section.name}</h3>
            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
              <span className='flex items-center gap-1'>
                <HelpCircle className='size-4' />
                {section.questionCount} Qs
              </span>
              <span className='flex items-center gap-1'>
                <Clock className='size-4' />
                {section.durationMinutes} Min
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
