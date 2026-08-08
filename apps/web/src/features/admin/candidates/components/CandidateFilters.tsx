'use client';

import * as React from 'react';
import { Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { CANDIDATE_STATUSES, CANDIDATE_SORT_OPTIONS } from '../constants';

interface CandidateFiltersProps {
  status: string;
  onStatusChange: (status: string) => void;
  qualification?: string;
  onQualificationChange?: (qualification: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onRefresh: () => void;
  isRefetching?: boolean;
}

export function CandidateFilters({
  status,
  onStatusChange,
  qualification = '',
  onQualificationChange,
  sortBy,
  sortOrder,
  onSortChange,
  onRefresh,
  isRefetching = false,
}: CandidateFiltersProps) {
  const currentSortKey = `${sortBy}-${sortOrder}`;

  const handleSortSelect = (val: string) => {
    const selected = CANDIDATE_SORT_OPTIONS.find((opt) => `${opt.sortBy}-${opt.sortOrder}` === val);
    if (selected) {
      onSortChange(selected.sortBy, selected.sortOrder);
    }
  };

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <div className='flex items-center gap-2'>
        <Filter className='w-4 h-4 text-muted-foreground hidden sm:block shrink-0' />
        <Select
          value={status || 'ALL'}
          onValueChange={(val: string) => onStatusChange(val === 'ALL' ? '' : val)}
        >
          <SelectTrigger className='w-[140px] sm:w-[150px] h-10 bg-background whitespace-nowrap'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            {CANDIDATE_STATUSES.map((opt) => (
              <SelectItem key={opt.value || 'ALL'} value={opt.value || 'ALL'}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {onQualificationChange && (
        <div className='flex items-center gap-2'>
          <Select
            value={qualification || 'ALL'}
            onValueChange={(val: string) => onQualificationChange(val === 'ALL' ? '' : val)}
          >
            <SelectTrigger className='w-[160px] sm:w-[170px] h-10 bg-background whitespace-nowrap'>
              <SelectValue placeholder='Qualification' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ALL'>All Qualifications</SelectItem>
              <SelectItem value='NOT_QUALIFIED'>Not Qualified</SelectItem>
              <SelectItem value='NINJA'>Ninja</SelectItem>
              <SelectItem value='DIGITAL'>Digital</SelectItem>
              <SelectItem value='PRIME'>Prime</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className='flex items-center gap-2'>
        <Select value={currentSortKey} onValueChange={handleSortSelect}>
          <SelectTrigger className='w-[160px] sm:w-[180px] h-10 bg-background whitespace-nowrap'>
            <SelectValue placeholder='Sort by' />
          </SelectTrigger>
          <SelectContent>
            {CANDIDATE_SORT_OPTIONS.map((opt) => (
              <SelectItem
                key={`${opt.sortBy}-${opt.sortOrder}`}
                value={`${opt.sortBy}-${opt.sortOrder}`}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant='outline'
        size='icon'
        onClick={onRefresh}
        disabled={isRefetching}
        title='Refresh data'
        className='h-10 w-10 shrink-0'
      >
        <RefreshCw
          className={`w-4 h-4 ${isRefetching ? 'animate-spin text-primary' : 'text-muted-foreground'}`}
        />
        <span className='sr-only'>Refresh</span>
      </Button>
    </div>
  );
}
