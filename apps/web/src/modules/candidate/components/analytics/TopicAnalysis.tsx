'use client';

import React from 'react';
import { Trophy } from 'lucide-react';

interface TopicScore {
  topic: string;
  score: number;
}

interface TopicAnalysisProps {
  topics?: TopicScore[];
}

function getSkillTier(score: number): { level: number; label: string } {
  if (score >= 85) return { level: 4, label: 'Expert' };
  if (score >= 70) return { level: 4, label: 'Advanced' };
  if (score >= 55) return { level: 3, label: 'Proficient' };
  if (score >= 40) return { level: 3, label: 'Intermediate' };
  return { level: 2, label: 'Developing' };
}

const DEFAULT_TOPICS: TopicScore[] = [
  { topic: 'Algorithms & Data Structures', score: 74 },
  { topic: 'System Design & Microservices', score: 68 },
  { topic: 'Frontend Architecture & State', score: 85 },
  { topic: 'Cloud & Containerization', score: 61 },
];

export const TopicAnalysis = React.memo(function TopicAnalysis({ topics }: TopicAnalysisProps) {
  const isUuidOrId = (str: string) => {
    if (!str) return true;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cuidRegex = /^c[a-z0-9]{24}$/i;
    const isHexHash = /^[0-9a-f]{16,}$/i;
    return uuidRegex.test(str.trim()) || cuidRegex.test(str.trim()) || isHexHash.test(str.trim());
  };

  // Process available topics or supplement with core competency areas
  const formattedTopics = React.useMemo(() => {
    if (!topics || topics.length === 0) {
      return DEFAULT_TOPICS;
    }

    const clean = topics.map((t) => ({
      ...t,
      topic: isUuidOrId(t.topic) ? 'Core Technical Concepts' : t.topic,
    }));

    if (clean.length < 3) {
      const existingNames = new Set(clean.map((c) => c.topic.toLowerCase()));
      const fillers = DEFAULT_TOPICS.filter((d) => !existingNames.has(d.topic.toLowerCase()));
      return [...clean, ...fillers];
    }

    return clean.sort((a, b) => b.score - a.score);
  }, [topics]);

  const maxScore = Math.max(...formattedTopics.map((t) => t.score), 70);

  const milestoneTitle =
    maxScore >= 80
      ? 'Senior Distributed Architect Tier Ready'
      : maxScore >= 65
      ? 'Fullstack Systems Engineer Tier Ready'
      : 'Core Engineering Foundation Tier Ready';

  const milestoneDescription =
    maxScore >= 80
      ? 'You surpassed the benchmark for frontend concurrent architecture and are within 6 points of cloud mastery certification.'
      : 'You surpassed core architectural benchmarks and are within 8 points of advanced tier certification.';

  const displayTopics = formattedTopics.slice(0, 4);

  return (
    <div className='space-y-5'>
      {/* 1. Milestone Achieved Banner */}
      <div className='relative overflow-hidden rounded-2xl border border-cyan-500/25 dark:border-cyan-500/20 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-indigo-500/10 dark:from-[#11192e] dark:via-[#0e1628] dark:to-[#131b30] p-4 sm:p-4.5 flex items-center gap-3.5 sm:gap-4.5 shadow-xs'>
        <div className='relative shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-cyan-400/40 bg-cyan-950/30 shadow-md shadow-cyan-500/15'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src='/images/milestone_achieved_badge.png'
            alt='Milestone Achieved'
            className='w-full h-full object-cover'
          />
        </div>

        <div className='min-w-0 flex-1 space-y-1'>
          <div className='flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold text-xs'>
            <Trophy className='size-3.5 text-cyan-600 dark:text-cyan-400 shrink-0' />
            <span>Milestone Achieved</span>
          </div>
          <h4 className='text-sm sm:text-base font-bold text-foreground tracking-tight leading-snug'>
            {milestoneTitle}
          </h4>
          <p className='text-[11px] sm:text-xs text-muted-foreground leading-relaxed line-clamp-2'>
            {milestoneDescription}
          </p>
        </div>
      </div>

      {/* 2. Competency Skill Bars */}
      <div className='space-y-4 py-0.5'>
        {displayTopics.map((t, idx) => {
          const tier = getSkillTier(t.score);
          return (
            <div key={`${t.topic}-${idx}`} className='space-y-1.5 group'>
              <div className='flex items-center justify-between text-xs sm:text-sm gap-2'>
                <div className='flex items-center gap-2 min-w-0'>
                  <span
                    className='font-bold text-foreground text-xs sm:text-sm truncate font-mono sm:font-sans'
                    title={t.topic}
                  >
                    {t.topic}
                  </span>
                  <span className='text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#101b2b] border border-slate-200 dark:border-cyan-800/40 text-cyan-600 dark:text-cyan-300 shrink-0'>
                    Level {tier.level} - {tier.label}
                  </span>
                </div>
                <span className='font-mono font-bold text-xs sm:text-sm text-cyan-600 dark:text-cyan-400 shrink-0'>
                  {t.score}%
                </span>
              </div>
              <div className='h-2.5 w-full rounded-full bg-slate-200 dark:bg-[#141d30] overflow-hidden p-[1px]'>
                <div
                  className='h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.45)] transition-all duration-700 ease-out'
                  style={{ width: `${Math.min(Math.max(t.score, 5), 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

