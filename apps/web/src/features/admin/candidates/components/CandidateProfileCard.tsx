'use client';

import * as React from 'react';
import { User, Mail, Phone, Calendar, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CandidateStatusBadge } from './CandidateStatusBadge';
import { formatCandidateDate } from '../utils';
import type { CandidateDetails } from '../types/candidate.types';

interface CandidateProfileCardProps {
  candidate?: CandidateDetails;
  isLoading?: boolean;
}

export function CandidateProfileCard({ candidate, isLoading = false }: CandidateProfileCardProps) {
  if (isLoading) {
    return (
      <Card className='p-6'>
        <CardHeader className='p-0 mb-4'>
          <Skeleton className='h-6 w-1/3' />
        </CardHeader>
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className='space-y-2'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-5 w-36' />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!candidate) return null;

  return (
    <Card className='p-6 border-l-4 border-l-primary shadow-xs'>
      <CardHeader className='p-0 mb-6 flex flex-row items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='p-3 bg-primary/10 text-primary rounded-full'>
            <User className='w-6 h-6' />
          </div>
          <div>
            <CardTitle className='text-xl font-bold text-foreground'>
              {candidate.name || 'Unnamed Candidate'}
            </CardTitle>
            <p className='text-sm text-muted-foreground font-mono mt-0.5'>ID: {candidate.id}</p>
          </div>
        </div>
        <CandidateStatusBadge status={candidate.status} className='text-sm px-3.5 py-1' />
      </CardHeader>

      <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-t pt-6 border-border/40'>
        <div className='flex items-start gap-3'>
          <Mail className='w-5 h-5 text-muted-foreground shrink-0 mt-0.5' />
          <div>
            <p className='text-xs font-semibold uppercase text-muted-foreground'>Email Address</p>
            <p className='text-sm font-medium text-foreground mt-0.5 break-all'>
              {candidate.email || 'N/A'}
            </p>
          </div>
        </div>

        <div className='flex items-start gap-3'>
          <Phone className='w-5 h-5 text-muted-foreground shrink-0 mt-0.5' />
          <div>
            <p className='text-xs font-semibold uppercase text-muted-foreground'>Phone Number</p>
            <p className='text-sm font-medium text-foreground mt-0.5'>
              {candidate.phone || 'Not provided'}
            </p>
          </div>
        </div>

        <div className='flex items-start gap-3'>
          <Calendar className='w-5 h-5 text-muted-foreground shrink-0 mt-0.5' />
          <div>
            <p className='text-xs font-semibold uppercase text-muted-foreground'>
              Registration Date
            </p>
            <p className='text-sm font-medium text-foreground mt-0.5'>
              {formatCandidateDate(candidate.createdAt)}
            </p>
          </div>
        </div>

        <div className='flex items-start gap-3'>
          <Shield className='w-5 h-5 text-muted-foreground shrink-0 mt-0.5' />
          <div>
            <p className='text-xs font-semibold uppercase text-muted-foreground'>
              Account Standing
            </p>
            <div className='mt-1'>
              <CandidateStatusBadge status={candidate.status} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
