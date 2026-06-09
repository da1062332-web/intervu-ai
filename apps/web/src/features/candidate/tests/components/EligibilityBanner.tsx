import { ValidationResponse } from '../types/test.types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function EligibilityBanner({ validation }: { validation: ValidationResponse }) {
  if (validation.isEligible) {
    return (
      <div className='relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 bg-green-500/10 text-green-600 border-green-500/20'>
        <CheckCircle2 className='h-5 w-5 !text-green-600' />
        <h5 className='mb-1 font-medium leading-none tracking-tight font-semibold'>Ready To Begin Assessment</h5>
        <div className='text-sm [&_p]:leading-relaxed'>You meet all the requirements to start this assessment.</div>
      </div>
    );
  }

  return (
    <div className='relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive'>
      <AlertCircle className='h-5 w-5' />
      <h5 className='mb-1 font-medium leading-none tracking-tight font-semibold'>Assessment Cannot Be Started</h5>
      <div className='text-sm [&_p]:leading-relaxed mt-2'>
        <ul className='list-disc pl-4 space-y-1'>
          {validation.errors.map((error, idx) => (
            <li key={idx}>{error}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
