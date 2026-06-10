import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstructionConfig } from '../types/test.types';
import { CheckCircle2 } from 'lucide-react';

export function InstructionPanel({ config }: { config: InstructionConfig }) {
  const sections = [
    { title: 'Assessment Rules', rules: config.assessmentRules },
    { title: 'Navigation Rules', rules: config.navigationRules },
    { title: 'Timer Rules', rules: config.timerRules },
    { title: 'Submission Rules', rules: config.submissionRules },
  ];

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Instructions</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {sections.map((section) => (
          <div key={section.title} className='space-y-2'>
            <h3 className='font-semibold text-lg text-foreground'>{section.title}</h3>
            <ul className='space-y-2'>
              {section.rules.map((rule, idx) => (
                <li key={idx} className='flex items-start gap-2 text-muted-foreground'>
                  <CheckCircle2 className='size-5 text-primary/70 shrink-0 mt-0.5' />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
