import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface AssemblyHealthCardProps {
  isValid: boolean;
  warnings?: string[];
}

export function AssemblyHealthCard({ isValid, warnings = [] }: AssemblyHealthCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          Assembly Health
          {isValid ? (
            <CheckCircle2 className='h-5 w-5 text-green-500' />
          ) : (
            <AlertCircle className='h-5 w-5 text-amber-500' />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isValid && warnings.length === 0 ? (
          <p className='text-sm text-green-600 font-medium'>
            Assembly matches blueprint perfectly.
          </p>
        ) : (
          <div className='space-y-2'>
            <p className='text-sm text-amber-600 font-medium'>Validation warnings found:</p>
            <ul className='list-disc pl-4 text-sm text-muted-foreground'>
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
