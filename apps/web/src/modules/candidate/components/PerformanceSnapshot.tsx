'use client';
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, FileText } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';

import { useDashboardWidgets } from '@/modules/results/hooks/results.hooks';

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { bounce: 0, duration: 1500 });
  const display = useTransform(spring, (current: number) => Math.round(current));
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span className='font-sans'>{display}</motion.span>;
}

export const PerformanceSnapshot = React.memo(function PerformanceSnapshot() {
  const { data, isLoading, error } = useDashboardWidgets();

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='rounded-2xl border border-border/50 bg-card'>
            <CardContent className='p-6 flex flex-col justify-between h-32'>
              <div className='flex justify-between items-center'>
                <div className='h-4 w-24 bg-muted animate-pulse rounded'></div>
                <div className='size-10 bg-muted animate-pulse rounded-xl'></div>
              </div>
              <div className='h-10 w-20 bg-muted animate-pulse rounded'></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return null; // Or a gentle error state
  }

  const bestScore = data.bestScore ?? 0;
  const avgAccuracy = data.averageAccuracy ? Math.round(data.averageAccuracy) : 0;
  const attempts = data.attemptCount ?? 0;

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      
      {/* Best Score Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className='relative overflow-hidden border border-border/50 bg-gradient-to-br from-card to-indigo-500/5 shadow-sm hover:shadow-md transition-all group rounded-xl'>
          <div className='absolute -right-6 -top-6 size-16 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all duration-500'></div>
          <CardContent className='p-3 relative z-10 flex flex-col justify-between'>
            
            <div className='flex items-center justify-between'>
              <p className='text-[10px] font-sans font-bold uppercase tracking-widest text-muted-foreground'>
                Best Score
              </p>
              <div className='p-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'>
                <Trophy className='size-3' />
              </div>
            </div>
            
            <div className='mt-1'>
              <div className='flex items-baseline gap-1'>
                <p className='text-2xl font-extrabold font-sans tracking-tight text-foreground'>
                  <AnimatedNumber value={bestScore} />
                </p>
                <span className='text-sm font-bold font-sans text-muted-foreground'>%</span>
              </div>
              
              <div className='mt-1 h-1 w-full bg-indigo-500/10 rounded-full overflow-hidden'>
                 <motion.div 
                   className='h-full bg-indigo-500'
                   initial={{ width: 0 }}
                   animate={{ width: `${bestScore}%` }}
                   transition={{ duration: 1.5, ease: 'easeOut' }}
                 />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Avg Accuracy Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className='relative overflow-hidden border border-border/50 bg-gradient-to-br from-card to-blue-500/5 shadow-sm hover:shadow-md transition-all group rounded-xl'>
          <div className='absolute -right-6 -top-6 size-16 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all duration-500'></div>
          <CardContent className='p-3 relative z-10 flex flex-col justify-between'>
            
            <div className='flex items-center justify-between'>
              <p className='text-[10px] font-sans font-bold uppercase tracking-widest text-muted-foreground'>
                Avg Accuracy
              </p>
              <div className='p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'>
                <Target className='size-3' />
              </div>
            </div>
            
            <div className='mt-1'>
              <div className='flex items-baseline gap-1'>
                <p className='text-2xl font-extrabold font-sans tracking-tight text-foreground'>
                  <AnimatedNumber value={avgAccuracy} />
                </p>
                <span className='text-sm font-bold font-sans text-muted-foreground'>%</span>
              </div>
              
              <div className='mt-1 h-1 w-full bg-blue-500/10 rounded-full overflow-hidden'>
                 <motion.div 
                   className='h-full bg-blue-500'
                   initial={{ width: 0 }}
                   animate={{ width: `${avgAccuracy}%` }}
                   transition={{ duration: 1.5, ease: 'easeOut' }}
                 />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Completed Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className='relative overflow-hidden border border-border/50 bg-gradient-to-br from-card to-emerald-500/5 shadow-sm hover:shadow-md transition-all group rounded-xl'>
          <div className='absolute -right-6 -top-6 size-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all duration-500'></div>
          <CardContent className='p-3 relative z-10 flex flex-col justify-between'>
            
            <div className='flex items-center justify-between'>
              <p className='text-[10px] font-sans font-bold uppercase tracking-widest text-muted-foreground'>
                Completed
              </p>
              <div className='p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'>
                <FileText className='size-3' />
              </div>
            </div>
            
            <div className='mt-1'>
              <div className='flex items-baseline gap-1'>
                <p className='text-2xl font-extrabold font-sans tracking-tight text-foreground'>
                  <AnimatedNumber value={attempts} />
                </p>
              </div>
              
              <div className='mt-1 h-1 w-full bg-transparent rounded-full'>
                 {/* Invisible spacer to match heights exactly */}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
});
