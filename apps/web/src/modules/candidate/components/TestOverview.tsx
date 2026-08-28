'use client';

import { useState } from 'react';
import { TestConfig } from '@/features/candidate/tests/types/test.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, HelpCircle, Building2, Star, Layers } from 'lucide-react';

interface TestOverviewProps {
  test: TestConfig;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

export function TestOverview({
  test,
  isBookmarked: externalBookmarked,
  onToggleBookmark,
}: TestOverviewProps) {
  const [internalBookmarked, setInternalBookmarked] = useState(false);
  const isBookmarked = externalBookmarked ?? internalBookmarked;

  const handleToggleBookmark = () => {
    if (onToggleBookmark) {
      onToggleBookmark();
    } else {
      setInternalBookmarked((prev) => !prev);
    }
  };

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    hard: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };

  const diffKey = (test.difficulty || 'Medium').toLowerCase();
  const difficultyClass =
    difficultyColors[diffKey] ||
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';

  const sectionNames =
    Array.isArray(test.sections) && test.sections.length > 0
      ? test.sections
          .map((s: any) => (typeof s === 'string' ? s : s.name || 'Default Section'))
          .join(', ')
      : 'Default Section';

  const descriptionText =
    test.description ||
    (sectionNames
      ? `Comprehensive examination evaluating competencies across ${sectionNames}.`
      : `Professional proficiency assessment designed to test domain expertise in ${test.title}.`);

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
            const mins =
              section.durationMinutes ||
              section.sectionDurationMinutes ||
              (section.durationSeconds ? Math.floor(section.durationSeconds / 60) : 0);
            return sum + (Number(mins) || 0);
          }
          return sum;
        }, 0)
      : 0;

  const testDurationMain =
    test.durationMinutes ||
    ((test as any).durationSeconds ? Math.floor((test as any).durationSeconds / 60) : 0) ||
    ((test as any).duration ? Math.floor((test as any).duration / 60) : 0);

  const finalDuration =
    testDurationMain > 0
      ? testDurationMain
      : totalDurationFromSections > 0
        ? totalDurationFromSections
        : 60;
  const finalQuestions =
    totalQuestionsFromSections > 0
      ? totalQuestionsFromSections
      : test.questionCount || (test as any).totalQuestions || 10;
  const finalSections =
    Array.isArray(test.sections) && test.sections.length > 0 ? test.sections.length : 1;

  const displayDuration = `${finalDuration} min`;
  const displayQuestions = `${finalQuestions}`;
  const displaySections = `${finalSections}`;

  return (
    <Card className='glass-card border border-border/60 shadow-sm relative overflow-hidden bg-card/80 hover:bg-card transition-all duration-200'>
      <CardHeader className='pb-4 relative'>
        <div className='flex justify-between items-start gap-2'>
          <div className='flex items-center gap-1.5 text-muted-foreground text-xs font-semibold'>
            <Building2 className='size-4 text-primary/80 shrink-0' />
            <span className='truncate max-w-[200px]'>{test.company || 'SkillitriX'}</span>
          </div>

          <div className='flex items-center gap-1.5 shrink-0'>
            <Badge
              variant='outline'
              className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 ${difficultyClass}`}
            >
              {test.difficulty || 'Medium'}
            </Badge>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='size-8 rounded-full text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10 shrink-0'
                    onClick={handleToggleBookmark}
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark test'}
                  >
                    <Star
                      className={`size-4 transition-transform hover:scale-110 ${isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`}
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

        <CardTitle className='text-xl font-bold mt-2 leading-snug tracking-tight text-foreground'>
          {test.title}
        </CardTitle>
        <CardDescription className='text-xs text-muted-foreground/90 mt-2 leading-relaxed'>
          {descriptionText}
        </CardDescription>
      </CardHeader>

      <CardContent className='pt-0 pb-4'>
        <div className='grid grid-cols-3 gap-3 border-y border-border/40 py-3.5 px-4 bg-muted/20 rounded-xl'>
          <div className='flex flex-col items-center justify-center text-center p-2.5 rounded-lg bg-card/60 border border-border/40 shadow-xs'>
            <Clock className='size-4 text-primary/80 mb-1' />
            <span className='text-xs font-bold text-foreground'>{displayDuration}</span>
            <span className='text-[9px] text-muted-foreground uppercase font-semibold tracking-wider mt-0.5'>
              Duration
            </span>
          </div>
          <div className='flex flex-col items-center justify-center text-center p-2.5 rounded-lg bg-card/60 border border-border/40 shadow-xs'>
            <HelpCircle className='size-4 text-violet-500 mb-1' />
            <span className='text-xs font-bold text-foreground'>{displayQuestions}</span>
            <span className='text-[9px] text-muted-foreground uppercase font-semibold tracking-wider mt-0.5'>
              Questions
            </span>
          </div>
          <div className='flex flex-col items-center justify-center text-center p-2.5 rounded-lg bg-card/60 border border-border/40 shadow-xs'>
            <Layers className='size-4 text-emerald-500 mb-1' />
            <span className='text-xs font-bold text-foreground'>{displaySections}</span>
            <span className='text-[9px] text-muted-foreground uppercase font-semibold tracking-wider mt-0.5'>
              Sections
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
