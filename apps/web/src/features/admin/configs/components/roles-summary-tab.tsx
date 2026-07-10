import React from 'react';

interface RolesSummaryTabProps {
  configId: string;
}

export function RolesSummaryTab({ configId }: RolesSummaryTabProps) {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-medium'>Roles</h3>
      <p className='text-sm text-muted-foreground'>
        Map the configuration to specific candidate roles or job descriptions.
      </p>
      <div className='p-8 border border-dashed rounded-md flex flex-col items-center justify-center text-center space-y-2'>
        <span className='text-muted-foreground text-sm'>
          Role mapping will be available here soon.
        </span>
      </div>
    </div>
  );
}
