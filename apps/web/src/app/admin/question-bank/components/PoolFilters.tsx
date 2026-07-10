import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { QuestionFilters } from '@/services/question-pool/types';

export interface PoolFiltersProps {
  filters: QuestionFilters;
  setFilters: React.Dispatch<React.SetStateAction<QuestionFilters>>;
  onClear: () => void;
}

export function PoolFilters({ filters, setFilters, onClear }: PoolFiltersProps) {
  return (
    <div className='bg-gray-50 dark:bg-gray-900 border rounded-md p-4 space-y-4'>
      <div className='flex justify-between items-center'>
        <h3 className='font-semibold text-sm'>Filters</h3>
        <Button variant='ghost' size='sm' onClick={onClear} className='h-8 text-xs'>
          Clear All
        </Button>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='space-y-2'>
          <Label>Search</Label>
          <Input
            placeholder='Search questions...'
            value={filters.search || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <div className='space-y-2'>
          <Label>Status</Label>
          <select
            className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            value={filters.status || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value=''>All Statuses</option>
            <option value='Approved'>Approved</option>
            <option value='Published'>Published</option>
          </select>
        </div>

        <div className='space-y-2'>
          <Label>Difficulty</Label>
          <select
            className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
            value={filters.difficulty || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, difficulty: e.target.value }))}
          >
            <option value=''>All Difficulties</option>
            <option value='Easy'>Easy</option>
            <option value='Medium'>Medium</option>
            <option value='Hard'>Hard</option>
          </select>
        </div>
      </div>
    </div>
  );
}
