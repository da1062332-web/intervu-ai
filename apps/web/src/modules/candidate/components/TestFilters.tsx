import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface TestFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  difficultyFilter: 'All' | 'Easy' | 'Medium' | 'Hard';
  onDifficultyChange: (difficulty: 'All' | 'Easy' | 'Medium' | 'Hard') => void;
  totalResults: number;
}

export function TestFilters({
  searchQuery,
  onSearchChange,
  difficultyFilter,
  onDifficultyChange,
  totalResults,
}: TestFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const difficulties: ('All' | 'Easy' | 'Medium' | 'Hard')[] = ['All', 'Easy', 'Medium', 'Hard'];

  // Sync from external prop changes (e.g. on reset)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce user input by 300ms before calling parent handler
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [localSearch, searchQuery, onSearchChange]);

  return (
    <Card className='bg-card/80 border border-border/60 shadow-xs'>
      <CardContent className='p-3 sm:p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5'>
        {/* Left Side: Search & Difficulty Toggle */}
        <div className='flex flex-col sm:flex-row sm:items-center gap-3 flex-1'>
          <div className='relative min-w-[240px] max-w-sm flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70' />
            <Input
              placeholder='Search assessments or company...'
              className='pl-9 h-9 bg-background/60 border-border/60 focus-visible:bg-background text-xs sm:text-sm transition-all'
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>

          <div className='flex items-center gap-1.5 shrink-0'>
            <span className='text-xs font-semibold text-muted-foreground hidden lg:inline-block mr-1'>
              Difficulty:
            </span>
            <div className='inline-flex p-1 bg-muted/50 border border-border/40 rounded-lg gap-1'>
              {difficulties.map((diff) => (
                <Button
                  key={diff}
                  variant={difficultyFilter === diff ? 'default' : 'ghost'}
                  size='sm'
                  onClick={() => onDifficultyChange(diff)}
                  className={`text-xs h-7 px-3 rounded-md font-medium transition-all ${
                    difficultyFilter === diff
                      ? 'shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {diff}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Match Count */}
        <div className='flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40'>
          <Badge
            variant='secondary'
            className='text-xs font-semibold px-3 py-1 h-8 flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 shrink-0'
          >
            {totalResults} {totalResults === 1 ? 'assessment' : 'assessments'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
