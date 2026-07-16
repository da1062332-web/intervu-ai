'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Target, FileText } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';

import { useDashboardWidgets } from '@/modules/results/hooks/results.hooks';

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { bounce: 0, duration: 1500 });
  const display = useTransform(spring, (current) => Math.round(current));
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

function RadialProgress({ value, colorClass }: { value: number; colorClass: string }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className='relative size-16 flex items-center justify-center'>
      <svg className='rotate-[-90deg] size-16 transform' viewBox='0 0 80 80'>
        <circle
          cx='40'
          cy='40'
          r={radius}
          className='stroke-muted/30 fill-none'
          strokeWidth='6'
        />
        <motion.circle
          cx='40'
          cy='40'
          r={radius}
          className={`fill-none ${colorClass}`}
          strokeWidth='6'
          strokeLinecap='round'
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className='absolute inset-0 flex items-center justify-center text-sm font-bold'>
        <AnimatedNumber value={value} />%
      </div>
    </div>
  );
}

export const PerformanceSnapshot = React.memo(function PerformanceSnapshot() {
  const { data, isLoading, error } = useDashboardWidgets();

  if (isLoading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='glass-card'>
            <CardContent className='p-6 flex items-center justify-between'>
              <div className='space-y-2'>
                <div className='h-4 w-20 bg-muted animate-pulse rounded'></div>
                <div className='h-8 w-12 bg-muted animate-pulse rounded'></div>
              </div>
              <div className='size-10 bg-muted animate-pulse rounded-full'></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return null; // Or a gentle error state, but null keeps the dashboard clean if metrics fail
  }

  const bestScore = data.bestScore ?? 0;
  const avgAccuracy = data.averageAccuracy ? Math.round(data.averageAccuracy) : 0;
  const attempts = data.attemptCount ?? 0;

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className='glass-card border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden'>
          <div className='absolute left-0 top-0 bottom-0 w-1 bg-indigo-500'></div>
          <CardContent className='p-6 flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-muted-foreground flex items-center gap-1.5'>
                <Trophy className='size-4 text-indigo-500' /> Best Score
              </p>
              <p className='text-3xl font-bold mt-2 text-foreground'>
                <AnimatedNumber value={bestScore} />%
              </p>
            </div>
            <RadialProgress value={bestScore} colorClass='stroke-indigo-500' />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className='glass-card border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden'>
          <div className='absolute left-0 top-0 bottom-0 w-1 bg-blue-500'></div>
          <CardContent className='p-6 flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-muted-foreground flex items-center gap-1.5'>
                <Target className='size-4 text-blue-500' /> Avg Accuracy
              </p>
              <p className='text-3xl font-bold mt-2 text-foreground'>
                <AnimatedNumber value={avgAccuracy} />%
              </p>
            </div>
            <RadialProgress value={avgAccuracy} colorClass='stroke-blue-500' />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className='glass-card border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden'>
          <div className='absolute left-0 top-0 bottom-0 w-1 bg-emerald-500'></div>
          <CardContent className='p-6 flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-muted-foreground flex items-center gap-1.5'>
                <FileText className='size-4 text-emerald-500' /> Completed
              </p>
              <p className='text-3xl font-bold mt-2 text-foreground'>
                <AnimatedNumber value={attempts} />
              </p>
            </div>
            <div className='size-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 ring-4 ring-emerald-500/20'>
              <FileText className='size-8' />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
});
