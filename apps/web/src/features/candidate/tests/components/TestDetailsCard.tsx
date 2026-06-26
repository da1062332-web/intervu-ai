import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, HelpCircle, Building } from 'lucide-react';
import { TestConfig } from '../types/test.types';

export function TestDetailsCard({ config }: { config: TestConfig }) {
  return (
    <Card className='h-full flex flex-col'>
      <CardHeader>
        <div className='flex justify-between items-start gap-4'>
          <div>
            <div className='flex items-center gap-2 mb-2 text-muted-foreground'>
              <Building className='size-4' />
              <span className='text-sm font-medium'>{config.company}</span>
            </div>
            <CardTitle className='text-2xl'>{config.title}</CardTitle>
          </div>
          <Badge variant='outline'>{config.difficulty}</Badge>
        </div>
        {false && <CardDescription className='mt-4 text-base'>N/A</CardDescription>}
      </CardHeader>
      <CardContent className='flex gap-6 mt-4'>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <HelpCircle className='size-5 text-primary/70' />
          <span className='font-medium'>Questions count not available</span>
        </div>
        {config.durationMinutes && (
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Clock className='size-5 text-primary/70' />
            <span className='font-medium'>{config.durationMinutes} Minutes</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
