import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(val: string) => setFilters((prev) => ({ ...prev, status: val === 'all' ? undefined : val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value='Approved'>Approved</SelectItem>
              <SelectItem value='Published'>Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label>Difficulty</Label>
          <Select 
            value={filters.difficulty || 'all'} 
            onValueChange={(val: string) => setFilters((prev) => ({ ...prev, difficulty: val === 'all' ? undefined : val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value='Easy'>Easy</SelectItem>
              <SelectItem value='Medium'>Medium</SelectItem>
              <SelectItem value='Hard'>Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
