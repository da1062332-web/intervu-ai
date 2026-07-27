'use client';

import * as React from 'react';
import { StatCard } from '@/components/ui/stat-card';
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
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Total Candidates"
        value={total}
        description="Registered assessment candidates"
        icon={<Users />}
        isLoading={isLoading}
      />
      <StatCard
        title="Active Accounts"
        value={activeCount}
        description="Currently enabled profiles"
        icon={<UserCheck />}
        isLoading={isLoading}
      />
      <StatCard
        title="Inactive / Deleted"
        value={inactiveCount}
        description="Disabled or unassigned accounts"
        icon={<UserX />}
        isLoading={isLoading}
      />
    </div>
  );
}
