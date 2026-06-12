'use client';

import { useExecutionStore } from '../stores/execution.store';
import { RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ResumeBanner() {
  const { isRecovered } = useExecutionStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isRecovered) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isRecovered]);

  if (!visible) return null;

  return (
    <div className='fixed top-20 right-4 z-[99999] animate-in slide-in-from-top-2 fade-in duration-300'>
      <div className='bg-primary text-primary-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-3'>
        <div className='bg-primary-foreground/20 p-1.5 rounded-md'>
          <RefreshCcw className='w-4 h-4' />
        </div>
        <div className='flex flex-col'>
          <span className='text-sm font-semibold'>Assessment Restored</span>
          <span className='text-xs opacity-90'>Successfully recovered your progress</span>
        </div>
      </div>
    </div>
  );
}
