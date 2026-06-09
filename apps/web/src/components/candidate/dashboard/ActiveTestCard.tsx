import { ActiveTest } from '@/features/candidate-dashboard/types/candidateDashboard.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, ArrowRightCircle } from 'lucide-react';

interface ActiveTestCardProps {
  tests: ActiveTest[];
}

export function ActiveTestCard({ tests }: ActiveTestCardProps) {
  if (tests.length === 0) {
    return null; // Don't show the section if no active tests
  }

  return (
    <Card className='h-full flex flex-col border-primary/20 bg-primary/5 dark:bg-primary/5'>
      <CardHeader>
        <CardTitle className='text-primary flex items-center gap-2'>
          <Timer className='size-5' />
          Active Assessments
        </CardTitle>
        <CardDescription>Assessments currently in progress</CardDescription>
      </CardHeader>
      <CardContent className='flex-1 space-y-4'>
        {tests.map((test) => (
          <div
            key={test.id}
            className='flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-primary/20 bg-background shadow-sm gap-4'
          >
            <div className='space-y-2 flex-1'>
              <div className='flex items-center gap-2'>
                <h3 className='font-semibold text-foreground'>{test.title}</h3>
                <Badge className='bg-primary text-primary-foreground hover:bg-primary/90'>
                  {test.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className='flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-500'>
                <Timer className='size-4' />
                {test.remainingMinutes} Minutes Remaining
              </div>
            </div>
            <Button className='w-full sm:w-auto shrink-0 group'>
              Resume Assessment
              <ArrowRightCircle className='ml-2 size-4 group-hover:translate-x-1 transition-transform' />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
