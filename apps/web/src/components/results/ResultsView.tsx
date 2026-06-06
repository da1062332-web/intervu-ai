'use client';

import React, { useEffect } from 'react';
import { useResultsStore, mockResult } from '@/store/results.store';
import { ResultHeader } from './ResultHeader';
import { ScoreCard } from './ScoreCard';
import { SkillCard } from './SkillCard';
import { EmptyResults } from './EmptyResults';
import { LoadingResults } from './LoadingResults';

export function ResultsView() {
  const {
    currentTest,
    evaluationResult,
    loading,
    setLoading,
    setCurrentTest,
    setEvaluationResult,
    setRecommendations,
  } = useResultsStore();

  useEffect(() => {
    // Simulate fetching data with a brief loading state
    setLoading(true);
    const timer = setTimeout(() => {
      setCurrentTest(mockResult.currentTest);
      setEvaluationResult(mockResult.evaluationResult);
      setRecommendations(mockResult.recommendations);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [setLoading, setCurrentTest, setEvaluationResult, setRecommendations]);

  if (loading) {
    return <LoadingResults />;
  }

  if (!evaluationResult || !currentTest) {
    return <EmptyResults />;
  }

  return (
    <div className='space-y-8 animate-in fade-in duration-500'>
      <ResultHeader
        candidateName={currentTest.candidateName}
        testTitle={currentTest.title}
        submittedAt={currentTest.submittedAt}
      />

      <ScoreCard
        overallScore={evaluationResult.overallScore}
        confidenceScore={evaluationResult.confidenceScore}
      />

      <section aria-label='Skills Assessment'>
        <h2 className='text-xl font-bold tracking-tight text-foreground mb-4'>Skills Assessment</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {evaluationResult.skills.map((skillItem, index) => (
            <SkillCard
              key={`${skillItem.skill}-${index}`}
              skill={skillItem.skill}
              score={skillItem.score}
              feedback={skillItem.feedback}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
