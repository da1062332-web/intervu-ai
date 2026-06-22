'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Search, Star, Filter, SlidersHorizontal } from 'lucide-react';

interface TestFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  difficultyFilter: 'All' | 'Easy' | 'Medium' | 'Hard';
  onDifficultyChange: (difficulty: 'All' | 'Easy' | 'Medium' | 'Hard') => void;
  showOnlyBookmarked: boolean;
  onShowOnlyBookmarkedChange: (val: boolean) => void;
  totalResults: number;
}

export function TestFilters({
  searchQuery,
  onSearchChange,
  difficultyFilter,
  onDifficultyChange,
  showOnlyBookmarked,
  onShowOnlyBookmarkedChange,
  totalResults,
}: TestFiltersProps) {
  const difficulties: ('All' | 'Easy' | 'Medium' | 'Hard')[] = ['All', 'Easy', 'Medium', 'Hard'];

  return (
    <div className='bg-card/75 border border-border/40 backdrop-blur-md rounded-2xl p-5 shadow-sm space-y-4'>
      <div className='flex items-center justify-between pb-3 border-b border-border/20'>
        <div className='flex items-center gap-2'>
          <SlidersHorizontal className='size-4 text-primary' />
          <h2 className='font-heading font-semibold text-sm text-foreground uppercase tracking-wider'>Filter Assessments</h2>
        </div>
        <span className='text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-full'>
          {totalResults} matches
        </span>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-12 gap-4 items-end'>
        {/* Search */}
        <div className='md:col-span-6 space-y-1.5'>
          <Label htmlFor='catalog-search' className='text-xs font-semibold text-muted-foreground'>
            Search by Assessment or Company
          </Label>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/80' />
            <Input
              id='catalog-search'
              placeholder='e.g. TCS NQT, Meta, Python...'
              className='pl-9 bg-muted/40 border-border/50 focus-visible:bg-card focus-visible:ring-1 transition-all'
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Difficulty */}
        <div className='md:col-span-6 space-y-1.5'>
          <Label className='text-xs font-semibold text-muted-foreground'>Difficulty Level</Label>
          <div className='flex gap-1.5 flex-wrap'>
            {difficulties.map((diff) => (
              <Button
                key={diff}
                variant={difficultyFilter === diff ? 'default' : 'outline'}
                size='sm'
                onClick={() => onDifficultyChange(diff)}
                className='text-xs font-medium rounded-lg h-9 px-3.5 transition-all'
              >
                {diff}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookmark Toggle */}
      <div className='flex items-center justify-between pt-3 border-t border-border/10'>
        <div className='flex items-center gap-3'>
          <div className='bg-yellow-500/10 p-2 rounded-lg text-yellow-600 dark:text-yellow-400'>
            <Star className='size-4 fill-current' />
          </div>
          <div>
            <p className='text-xs font-semibold text-foreground'>Bookmarked Assessments</p>
            <p className='text-[10px] text-muted-foreground'>Show only assessments you've starred</p>
          </div>
        </div>
        <div className='flex items-center space-x-2'>
          <Switch
            id='bookmark-toggle'
            checked={showOnlyBookmarked}
            onCheckedChange={onShowOnlyBookmarkedChange}
          />
        </div>
      </div>
    </div>
  );
}
