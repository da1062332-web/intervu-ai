'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';

interface CandidateStatusBadgeProps {
  status?: string;
  className?: string;
}

export function CandidateStatusBadge({ status = 'ACTIVE', className }: CandidateStatusBadgeProps) {
  const isActive = status?.toUpperCase() === 'ACTIVE';

  return (
    <Badge variant={isActive ? 'success' : 'destructive'} className={className}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}
