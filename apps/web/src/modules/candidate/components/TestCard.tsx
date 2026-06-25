'use client';

import Link from 'next/link';
import { TestConfig } from '@/features/candidate/tests/types/test.types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, HelpCircle, Star, Building2, ChevronRight, Layers } from 'lucide-react';

interface TestCardProps {
  test: TestConfig;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export function TestCard({ test, isBookmarked, onToggleBookmark }: TestCardProps) {
  const difficultyColors: Record<string, string> = {
    Easy: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Hard: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };

  return (
    <Card className='h-full flex flex-col glass-card hover:shadow-lg transition-all duration-300 border border-border/60 group relative overflow-hidden'>
      <CardHeader className='pb-4 relative'>
        <div className='flex justify-between items-start gap-2'>
          <div className='flex items-center gap-1.5 text-muted-foreground text-xs font-semibold'>
            <Building2 className='size-3.5' />
            <span className='truncate max-w-[150px]'>{test.company || 'Unknown'}</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <Badge
              variant='outline'
              className={`text-[10px] uppercase font-bold tracking-wider ${difficultyColors[test.difficulty] || ''}`}
            >
              {test.difficulty}
            </Badge>
            <Button
              variant='ghost'
              size='icon'
              className='size-8 rounded-full text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/5 shrink-0'
              onClick={(e) => {
                e.preventDefault();
                onToggleBookmark();
              }}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark test'}
            >
              <Star
                className={`size-4.5 transition-transform group-hover:scale-105 ${isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`}
              />
            </Button>
          </div>
        </div>
        <CardTitle className='text-lg font-bold mt-2 leading-snug group-hover:text-primary transition-colors line-clamp-1'>
          {test.title}
        </CardTitle>
        <CardDescription className='text-xs text-muted-foreground mt-2 line-clamp-2 min-h-[32px]'>
          No description available
        </CardDescription>
      </CardHeader>

      <CardContent className='pb-4 pt-0 flex-1 grid grid-cols-3 gap-2 border-y border-border/20 py-3 bg-muted/20'>
        <div className='flex flex-col items-center justify-center text-center p-1.5 rounded bg-card/40 border border-border/10'>
          <Clock className='size-4 text-primary/70 mb-1' />
          <span className='text-[11px] font-bold text-foreground'>{test.durationMinutes || 'N/A'} min</span>
          <span className='text-[9px] text-muted-foreground uppercase font-semibold tracking-wider'>
            Duration
          </span>
        </div>
        <div className='flex flex-col items-center justify-center text-center p-1.5 rounded bg-card/40 border border-border/10'>
          <HelpCircle className='size-4 text-violet-500 mb-1' />
          <span className='text-[11px] font-bold text-foreground'>N/A</span>
          <span className='text-[9px] text-muted-foreground uppercase font-semibold tracking-wider'>
            Questions
          </span>
        </div>
        <div className='flex flex-col items-center justify-center text-center p-1.5 rounded bg-card/40 border border-border/10'>
          <Layers className='size-4 text-emerald-500 mb-1' />
          <span className='text-[11px] font-bold text-foreground'>{test.sections.length}</span>
          <span className='text-[9px] text-muted-foreground uppercase font-semibold tracking-wider'>
            Sections
          </span>
        </div>
      </CardContent>

      <CardFooter className='pt-3 pb-3 justify-end bg-card'>
        <Button
          asChild
          size='sm'
          variant='ghost'
          className='text-xs font-semibold group-hover:text-primary transition-colors pl-2 pr-2.5'
        >
          <Link href={`/candidate/tests/${test.id}`}>
            View Details
            <ChevronRight className='ml-1 size-3.5 group-hover:translate-x-0.5 transition-transform' />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
