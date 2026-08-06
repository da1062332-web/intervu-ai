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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

  const sectionNames = Array.isArray(test.sections) && test.sections.length > 0
    ? test.sections.map((s: any) => typeof s === 'string' ? s : (s.name || 'Core Topics')).join(', ')
    : null;
    
  const descriptionText = test.description || (
    sectionNames
      ? `Comprehensive examination evaluating competencies across ${sectionNames}.`
      : `Professional proficiency assessment designed to test domain expertise in ${test.title}.`
  );

  const totalQuestionsFromSections =
    Array.isArray(test.sections) && test.sections.length > 0
      ? test.sections.reduce((sum: number, section: any) => {
          if (typeof section === 'object' && section !== null && section.questionCount) {
            return sum + Number(section.questionCount);
          }
          return sum;
        }, 0)
      : 0;

  const totalDurationFromSections =
    Array.isArray(test.sections) && test.sections.length > 0
      ? test.sections.reduce((sum: number, section: any) => {
          if (typeof section === 'object' && section !== null) {
            const mins = section.durationMinutes || section.sectionDurationMinutes || (section.durationSeconds ? Math.floor(section.durationSeconds / 60) : 0);
            return sum + (Number(mins) || 0);
          }
          return sum;
        }, 0)
      : 0;

  const testDurationMain =
    test.durationMinutes ||
    ((test as any).durationSeconds ? Math.floor((test as any).durationSeconds / 60) : 0) ||
    ((test as any).duration ? Math.floor((test as any).duration / 60) : 0);

  const finalDuration = testDurationMain > 0 ? testDurationMain : (totalDurationFromSections > 0 ? totalDurationFromSections : 60);
  const finalQuestions = totalQuestionsFromSections > 0 ? totalQuestionsFromSections : (test.questionCount || (test as any).totalQuestions || 0);

  const displayDuration = finalDuration > 0 ? `${finalDuration} min` : 'Flexible';
  const displayQuestions = finalQuestions > 0 ? `${finalQuestions}` : 'Adaptive';
  const displaySections = Array.isArray(test.sections) && test.sections.length > 0 ? test.sections.length : 1;

  return (
    <Card className='h-full flex flex-col bg-card/80 hover:bg-card hover:shadow-md transition-all duration-200 border border-border/60 group relative overflow-hidden'>
      <CardHeader className='pb-4 relative'>
        <div className='flex justify-between items-start gap-2'>
          <div className='flex items-center gap-1.5 text-muted-foreground text-xs font-semibold'>
            <Building2 className='size-3.5 text-primary/80 shrink-0' />
            <span className='truncate max-w-[160px]'>{test.company || 'Platform Assessment'}</span>
          </div>
          <div className='flex items-center gap-1.5 shrink-0'>
            <Badge
              variant='outline'
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${difficultyColors[test.difficulty] || 'bg-muted text-muted-foreground'}`}
            >
              {test.difficulty || 'Standard'}
            </Badge>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-8 rounded-full text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 shrink-0'
                    onClick={(e) => {
                      e.preventDefault();
                      onToggleBookmark();
                    }}
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark test'}
                  >
                    <Star
                      className={`size-4 transition-transform group-hover:scale-105 ${isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isBookmarked ? 'Remove Bookmark' : 'Save to Bookmarks'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <CardTitle className='text-lg font-bold mt-2 leading-snug group-hover:text-primary transition-colors line-clamp-1'>
          {test.title}
        </CardTitle>
        <CardDescription className='text-xs text-muted-foreground/90 mt-2 line-clamp-2 min-h-[36px] leading-relaxed'>
          {descriptionText}
        </CardDescription>
      </CardHeader>

      <CardContent className='pb-4 pt-0 flex-1 grid grid-cols-3 gap-2.5 border-y border-border/40 py-3.5 bg-muted/20'>
        <div className='flex flex-col items-center justify-center text-center p-2 rounded-lg bg-card/60 border border-border/40'>
          <Clock className='size-4 text-primary/80 mb-1' />
          <span className='text-[11px] font-bold text-foreground'>
            {displayDuration}
          </span>
          <span className='text-[9px] text-muted-foreground uppercase font-semibold tracking-wider mt-0.5'>
            Duration
          </span>
        </div>
        <div className='flex flex-col items-center justify-center text-center p-2 rounded-lg bg-card/60 border border-border/40'>
          <HelpCircle className='size-4 text-violet-500 mb-1' />
          <span className='text-[11px] font-bold text-foreground'>
            {displayQuestions}
          </span>
          <span className='text-[9px] text-muted-foreground uppercase font-semibold tracking-wider mt-0.5'>
            Questions
          </span>
        </div>
        <div className='flex flex-col items-center justify-center text-center p-2 rounded-lg bg-card/60 border border-border/40'>
          <Layers className='size-4 text-emerald-500 mb-1' />
          <span className='text-[11px] font-bold text-foreground'>
            {displaySections}
          </span>
          <span className='text-[9px] text-muted-foreground uppercase font-semibold tracking-wider mt-0.5'>
            Sections
          </span>
        </div>
      </CardContent>

      <CardFooter className='p-4 bg-card/40 border-t border-border/40'>
        <Button
          asChild
          variant='default'
          size='sm'
          className='w-full font-semibold h-9 text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5'
        >
          <Link href={`/candidate/tests/${test.id}`}>
            <span>View Assessment</span>
            <ChevronRight className='size-4 group-hover:translate-x-0.5 transition-transform' />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
