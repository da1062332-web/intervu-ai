'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Users, UserCheck, UserX } from 'lucide-react';

interface CandidateOverviewCardProps {
  total?: number;
  activeCount?: number;
  inactiveCount?: number;
  isLoading?: boolean;
}

export function CandidateOverviewCard({
  total = 0,
  activeCount = 0,
  inactiveCount = 0,
  isLoading = false,
}: CandidateOverviewCardProps) {
  return (
    <Card className="p-4 bg-muted/20 border-primary/10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-2">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Total Candidates</p>
            <p className="text-2xl font-bold">{isLoading ? '...' : total}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 border-t md:border-t-0 md:border-l border-border/60">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Active Accounts</p>
            <p className="text-2xl font-bold">{isLoading ? '...' : activeCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 border-t md:border-t-0 md:border-l border-border/60">
          <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold">Inactive / Deleted</p>
            <p className="text-2xl font-bold">{isLoading ? '...' : inactiveCount}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
