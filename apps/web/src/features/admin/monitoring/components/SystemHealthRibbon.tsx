'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Wifi,
  WifiOff,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Activity,
  Server,
  Zap,
} from 'lucide-react';
import { MonitoringSummary, SystemHealthData } from '../hooks/useLiveMonitoring';

interface SystemHealthRibbonProps {
  summary: MonitoringSummary;
  health: SystemHealthData | null;
  isConnected: boolean;
  onFilterStatus?: (status: string) => void;
  activeStatusFilter?: string;
}

export function SystemHealthRibbon({
  summary,
  health,
  isConnected,
  onFilterStatus,
  activeStatusFilter,
}: SystemHealthRibbonProps) {
  const cards = [
    {
      label: 'Active Candidates',
      count: summary.active,
      filter: 'ACTIVE',
      icon: Wifi,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500 animate-pulse',
    },
    {
      label: 'Needs Attention',
      count: summary.needsAttentionCount,
      filter: 'ATTENTION',
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      dot: summary.needsAttentionCount > 0 ? 'bg-amber-500 animate-ping' : 'bg-amber-500',
    },
    {
      label: 'Disconnected',
      count: summary.disconnected,
      filter: 'DISCONNECTED',
      icon: WifiOff,
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      dot: 'bg-rose-500',
    },
    {
      label: 'Auto-Submitted',
      count: summary.autoSubmitted,
      filter: 'AUTO_SUBMITTED',
      icon: RotateCcw,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
      dot: 'bg-purple-500',
    },
    {
      label: 'Submitted / Done',
      count: summary.submitted + summary.completed,
      filter: 'SUBMITTED',
      icon: CheckCircle2,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
    {
      label: 'Total Enrolled',
      count: summary.total,
      filter: 'ALL',
      icon: Users,
      color: 'text-slate-500',
      bg: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
      dot: 'bg-slate-400',
    },
  ];

  return (
    <div className='space-y-4'>
      {/* Vitals Ribbon */}
      <div className='flex flex-wrap items-center justify-between gap-3 p-3 bg-card border rounded-lg shadow-sm text-xs'>
        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex items-center gap-2'>
            <span
              className={`size-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
            />
            <span className='font-medium text-foreground'>
              {isConnected ? 'Real-Time SSE Live' : 'Reconnecting to Stream...'}
            </span>
          </div>

          <div className='h-4 w-px bg-border' />

          <div className='flex items-center gap-1.5 text-muted-foreground'>
            <Activity className='size-3.5 text-primary' />
            <span>Avg Latency:</span>
            <span
              className={`font-semibold ${summary.avgLatencyMs < 300 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}
            >
              {summary.avgLatencyMs} ms
            </span>
          </div>

          <div className='h-4 w-px bg-border' />

          <div className='flex items-center gap-1.5 text-muted-foreground'>
            <Zap className='size-3.5 text-emerald-500' />
            <span>Autosave Health:</span>
            <span className='font-semibold text-foreground'>{summary.autosaveHealthPercentage}%</span>
          </div>

          <div className='h-4 w-px bg-border' />

          <div className='flex items-center gap-1.5 text-muted-foreground'>
            <Server className='size-3.5 text-blue-500' />
            <span>DB Latency:</span>
            <span className='font-semibold text-foreground'>
              {health?.database?.latencyMs ?? 2} ms
            </span>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Badge
            variant={
              health?.status === 'HEALTHY'
                ? 'outline'
                : health?.status === 'DEGRADED'
                  ? 'secondary'
                  : 'destructive'
            }
            className='font-medium text-[11px]'
          >
            System {health?.status || 'HEALTHY'}
          </Badge>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'>
        {cards.map((c) => {
          const isSelected = activeStatusFilter === c.filter;
          return (
            <Card
              key={c.label}
              onClick={() => onFilterStatus?.(c.filter)}
              className={`cursor-pointer transition-all duration-150 hover:shadow-md border ${
                isSelected
                  ? 'ring-2 ring-primary border-primary shadow-sm'
                  : 'hover:border-primary/50'
              }`}
            >
              <CardContent className='p-3.5 flex flex-col justify-between h-full space-y-2'>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>{c.label}</span>
                  <span className={`size-2 rounded-full ${c.dot}`} />
                </div>
                <div className='flex items-baseline justify-between'>
                  <span className='text-2xl font-bold tracking-tight text-foreground'>
                    {c.count}
                  </span>
                  <c.icon className={`size-4 ${c.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
