'use client';

import React, { useState } from 'react';
import { HiringEvaluationCard } from '@/features/candidate/results/components/HiringEvaluationCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Zap,
  Code,
  TrendingUp,
  AlertCircle,
  Download,
  Check,
  AlertTriangle,
  Lightbulb,
  Terminal,
  Compass,
  Hourglass,
  Layers,
} from 'lucide-react';

export default function TCSDemoResultPage() {
  const [selectedTier, setSelectedTier] = useState<'PRIME' | 'DIGITAL' | 'NINJA' | 'NOT_QUALIFIED'>(
    'NOT_QUALIFIED',
  );

  const demoDataMap = {
    PRIME: {
      qualification: 'PRIME',
      qualificationReason:
        'Qualified for PRIME Role! Cleared all Foundation Sectional cutoffs, met Prime Foundation score threshold (38/35), Advanced score threshold (14/12), and solved 2/2 Coding problems.',
      evaluationStrategy: 'TCS',
      foundationScore: 38,
      advancedScore: 14,
      codingSolved: 2,
      overallScore: 92,
      grade: 'A+',
      accuracy: 92,
      timeTaken: '48m',
      codingScore: '2 / 2 pts',
      codingAccuracy: 100,
      codingPassed: 2,
      codingFailed: 0,
      functionalCorrectness: '100%',
      testCaseSuite: '2/2 Passed',
      reasoningAccuracy: '95%',
      reasoningCorrect: 19,
      reasoningSkipped: 1,
      reasoningWrong: 0,
      reasoningTimeSpent: '22m',
      codingTimeSpent: '26m',
      codingPace: '13m/q',
      codingStatusText: 'Outstanding performance (100% acc, 86% time used)',
      qualificationDetails: {
        foundationBreakdown: {
          numericalScore: 13,
          numericalMin: 5,
          verbalScore: 13,
          verbalMin: 5,
          reasoningScore: 12,
          reasoningMin: 5,
          foundationTotal: 38,
          ninjaThreshold: 15,
          digitalThreshold: 25,
          primeThreshold: 35,
          sectionsBreakdown: [
            {
              category: 'NUMERICAL',
              sectionCode: 'SEC_NUM',
              sectionName: 'Numerical Ability',
              correctCount: 13,
              requiredMin: 5,
              passed: true,
            },
            {
              category: 'VERBAL',
              sectionCode: 'SEC_VERB',
              sectionName: 'Verbal Ability',
              correctCount: 13,
              requiredMin: 5,
              passed: true,
            },
            {
              category: 'REASONING',
              sectionCode: 'SEC_REAS',
              sectionName: 'Reasoning Ability',
              correctCount: 12,
              requiredMin: 5,
              passed: true,
            },
          ],
        },
        advancedBreakdown: {
          advancedScore: 14,
          advancedMinDigital: 8,
          advancedMinPrime: 12,
          passedDigital: true,
          passedPrime: true,
        },
        codingBreakdown: {
          totalCodingProblems: 2,
          codingSolved: 2,
          codingMinDigital: 1,
          codingMinPrime: 2,
          passedDigital: true,
          passedPrime: true,
        },
      },
    },
    DIGITAL: {
      qualification: 'DIGITAL',
      qualificationReason:
        'Qualified for DIGITAL Role! Cleared Foundation Sectional cutoffs, met Digital Foundation threshold (28/25), Advanced score threshold (10/8), and solved 1/2 Coding problems.',
      evaluationStrategy: 'TCS',
      foundationScore: 28,
      advancedScore: 10,
      codingSolved: 1,
      overallScore: 74,
      grade: 'B+',
      accuracy: 74,
      timeTaken: '52m',
      codingScore: '1 / 2 pts',
      codingAccuracy: 50,
      codingPassed: 1,
      codingFailed: 0,
      functionalCorrectness: '50%',
      testCaseSuite: '1/1 Passed',
      reasoningAccuracy: '70%',
      reasoningCorrect: 14,
      reasoningSkipped: 4,
      reasoningWrong: 2,
      reasoningTimeSpent: '25m',
      codingTimeSpent: '27m',
      codingPace: '25s/q',
      codingStatusText: 'Steady pace (50% acc, 3% time used)',
      qualificationDetails: {
        foundationBreakdown: {
          numericalScore: 10,
          numericalMin: 5,
          verbalScore: 9,
          verbalMin: 5,
          reasoningScore: 9,
          reasoningMin: 5,
          foundationTotal: 28,
          ninjaThreshold: 15,
          digitalThreshold: 25,
          primeThreshold: 35,
          sectionsBreakdown: [
            {
              category: 'NUMERICAL',
              sectionCode: 'SEC_NUM',
              sectionName: 'Numerical Ability',
              correctCount: 10,
              requiredMin: 5,
              passed: true,
            },
            {
              category: 'VERBAL',
              sectionCode: 'SEC_VERB',
              sectionName: 'Verbal Ability',
              correctCount: 9,
              requiredMin: 5,
              passed: true,
            },
            {
              category: 'REASONING',
              sectionCode: 'SEC_REAS',
              sectionName: 'Reasoning Ability',
              correctCount: 9,
              requiredMin: 5,
              passed: true,
            },
          ],
        },
        advancedBreakdown: {
          advancedScore: 10,
          advancedMinDigital: 8,
          advancedMinPrime: 12,
          passedDigital: true,
          passedPrime: false,
        },
        codingBreakdown: {
          totalCodingProblems: 2,
          codingSolved: 1,
          codingMinDigital: 1,
          codingMinPrime: 2,
          passedDigital: true,
          passedPrime: false,
        },
      },
    },
    NINJA: {
      qualification: 'NINJA',
      qualificationReason:
        'Qualified for NINJA Role! Cleared Foundation Sectional cutoffs and met Ninja Foundation score threshold (19/15).',
      evaluationStrategy: 'TCS',
      foundationScore: 19,
      advancedScore: 5,
      codingSolved: 0,
      overallScore: 52,
      grade: 'C',
      accuracy: 52,
      timeTaken: '58m',
      codingScore: '0 / 2 pts',
      codingAccuracy: 0,
      codingPassed: 0,
      codingFailed: 2,
      functionalCorrectness: '0%',
      testCaseSuite: '0/2 Passed',
      reasoningAccuracy: '50%',
      reasoningCorrect: 10,
      reasoningSkipped: 6,
      reasoningWrong: 4,
      reasoningTimeSpent: '28m',
      codingTimeSpent: '30m',
      codingPace: '15m/q',
      codingStatusText: 'Needs Improvement (0% acc, 100% time used)',
      qualificationDetails: {
        foundationBreakdown: {
          numericalScore: 7,
          numericalMin: 5,
          verbalScore: 6,
          verbalMin: 5,
          reasoningScore: 6,
          reasoningMin: 5,
          foundationTotal: 19,
          ninjaThreshold: 15,
          digitalThreshold: 25,
          primeThreshold: 35,
          sectionsBreakdown: [
            {
              category: 'NUMERICAL',
              sectionCode: 'SEC_NUM',
              sectionName: 'Numerical Ability',
              correctCount: 7,
              requiredMin: 5,
              passed: true,
            },
            {
              category: 'VERBAL',
              sectionCode: 'SEC_VERB',
              sectionName: 'Verbal Ability',
              correctCount: 6,
              requiredMin: 5,
              passed: true,
            },
            {
              category: 'REASONING',
              sectionCode: 'SEC_REAS',
              sectionName: 'Reasoning Ability',
              correctCount: 6,
              requiredMin: 5,
              passed: true,
            },
          ],
        },
        advancedBreakdown: {
          advancedScore: 5,
          advancedMinDigital: 8,
          advancedMinPrime: 12,
          passedDigital: false,
          passedPrime: false,
        },
        codingBreakdown: {
          totalCodingProblems: 2,
          codingSolved: 0,
          codingMinDigital: 1,
          codingMinPrime: 2,
          passedDigital: false,
          passedPrime: false,
        },
      },
    },
    NOT_QUALIFIED: {
      qualification: 'NOT_QUALIFIED',
      qualificationReason:
        'Sectional cutoff not cleared: Numerical Ability (0/20 correct, minimum 5 required).',
      evaluationStrategy: 'TCS',
      foundationScore: 1,
      advancedScore: 0,
      codingSolved: 1,
      overallScore: 5,
      grade: 'C',
      accuracy: 5,
      timeTaken: '1m',
      codingScore: '1 / 2 pts',
      codingAccuracy: 50,
      codingPassed: 1,
      codingFailed: 0,
      functionalCorrectness: '50%',
      testCaseSuite: '1/1 Passed',
      reasoningAccuracy: '0%',
      reasoningCorrect: 0,
      reasoningSkipped: 20,
      reasoningWrong: 0,
      reasoningTimeSpent: '0m',
      codingTimeSpent: '1m',
      codingPace: '25s/q',
      codingStatusText: 'Steady pace (50% acc, 3% time used)',
      qualificationDetails: {
        foundationBreakdown: {
          numericalScore: 0,
          numericalMin: 5,
          verbalScore: 1,
          verbalMin: 5,
          reasoningScore: 0,
          reasoningMin: 5,
          foundationTotal: 1,
          ninjaThreshold: 15,
          digitalThreshold: 25,
          primeThreshold: 35,
          sectionsBreakdown: [
            {
              category: 'NUMERICAL',
              sectionCode: 'SEC_NUM',
              sectionName: 'Numerical Ability',
              correctCount: 0,
              requiredMin: 5,
              passed: false,
            },
            {
              category: 'VERBAL',
              sectionCode: 'SEC_VERB',
              sectionName: 'Verbal Ability',
              correctCount: 1,
              requiredMin: 5,
              passed: false,
            },
            {
              category: 'REASONING',
              sectionCode: 'SEC_REAS',
              sectionName: 'Reasoning Ability',
              correctCount: 0,
              requiredMin: 5,
              passed: false,
            },
          ],
        },
        advancedBreakdown: {
          advancedScore: 0,
          advancedMinDigital: 8,
          advancedMinPrime: 12,
          passedDigital: false,
          passedPrime: false,
        },
        codingBreakdown: {
          totalCodingProblems: 2,
          codingSolved: 1,
          codingMinDigital: 1,
          codingMinPrime: 2,
          passedDigital: true,
          passedPrime: false,
        },
      },
    },
  };

  const activeData = demoDataMap[selectedTier];

  return (
    <div className='min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-6xl mx-auto space-y-6'>
        {/* Tier Selector Bar for Demo Preview */}
        <Card className='border border-indigo-100 shadow-sm bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white overflow-hidden'>
          <CardContent className='p-5 flex flex-col sm:flex-row items-center justify-between gap-4'>
            <div>
              <div className='flex items-center gap-2 mb-1'>
                <Sparkles className='h-4 w-4 text-indigo-400' />
                <span className='text-xs font-semibold uppercase tracking-wider text-indigo-300'>
                  TCS Hiring Evaluation Interactive Preview
                </span>
              </div>
              <h2 className='text-lg font-bold text-white'>Select Candidate Outcome Tier:</h2>
            </div>

            <div className='flex flex-wrap gap-2'>
              <Button
                size='sm'
                variant={selectedTier === 'NOT_QUALIFIED' ? 'secondary' : 'ghost'}
                className={
                  selectedTier === 'NOT_QUALIFIED'
                    ? 'bg-red-500 text-white hover:bg-red-600 font-medium'
                    : 'text-slate-300 hover:text-white'
                }
                onClick={() => setSelectedTier('NOT_QUALIFIED')}
              >
                ❌ FAIL / NOT QUALIFIED
              </Button>
              <Button
                size='sm'
                variant={selectedTier === 'NINJA' ? 'secondary' : 'ghost'}
                className={
                  selectedTier === 'NINJA'
                    ? 'bg-blue-500 text-white hover:bg-blue-600 font-medium'
                    : 'text-slate-300 hover:text-white'
                }
                onClick={() => setSelectedTier('NINJA')}
              >
                🛡️ NINJA
              </Button>
              <Button
                size='sm'
                variant={selectedTier === 'DIGITAL' ? 'secondary' : 'ghost'}
                className={
                  selectedTier === 'DIGITAL'
                    ? 'bg-purple-500 text-white hover:bg-purple-600 font-medium'
                    : 'text-slate-300 hover:text-white'
                }
                onClick={() => setSelectedTier('DIGITAL')}
              >
                ⭐ DIGITAL
              </Button>
              <Button
                size='sm'
                variant={selectedTier === 'PRIME' ? 'secondary' : 'ghost'}
                className={
                  selectedTier === 'PRIME'
                    ? 'bg-amber-500 text-white hover:bg-amber-600 font-medium'
                    : 'text-slate-300 hover:text-white'
                }
                onClick={() => setSelectedTier('PRIME')}
              >
                🏆 PRIME
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Assessment Header */}
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-slate-900'>
              Qioax Assessment (TCS NQT Strategy)
            </h1>
            <div className='flex items-center gap-3 mt-1.5 text-xs text-slate-500'>
              <span>Submitted on {new Date().toLocaleDateString()}</span>
              <span>•</span>
              <span className='flex items-center gap-1 font-medium text-emerald-600'>
                <CheckCircle2 className='h-3.5 w-3.5' /> Evaluation Status: COMPLETED
              </span>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <Button variant='outline' size='sm' className='gap-1.5'>
              View Analytics
            </Button>
            <Button variant='outline' size='sm' className='gap-1.5'>
              Export JSON
            </Button>
            <Button size='sm' className='bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5'>
              <Download className='h-4 w-4' /> Export PDF
            </Button>
          </div>
        </div>

        {/* Section Heading */}
        <div className='space-y-1'>
          <h2 className='text-xl font-bold tracking-tight text-slate-900'>
            Performance Insights Dashboard
          </h2>
          <p className='text-sm text-slate-500'>
            Comprehensive analysis of your test performance, strengths, weaknesses, and TCS
            qualification status.
          </p>
        </div>

        {/* Overall Score Card Grid */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <Card className='border shadow-sm text-center py-4 bg-white'>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>
              Overall Score
            </p>
            <p className='text-3xl font-extrabold text-slate-900 mt-1'>
              {activeData.overallScore}{' '}
              <span className='text-sm font-normal text-slate-400'>/ 100</span>
            </p>
          </Card>

          <Card className='border shadow-sm text-center py-4 bg-white'>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Grade</p>
            <p
              className={`text-3xl font-extrabold mt-1 ${activeData.grade === 'A+' ? 'text-amber-600' : activeData.grade === 'B+' ? 'text-purple-600' : 'text-emerald-600'}`}
            >
              {activeData.grade}
            </p>
          </Card>

          <Card className='border shadow-sm text-center py-4 bg-white'>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Accuracy</p>
            <p className='text-3xl font-extrabold text-blue-600 mt-1'>{activeData.accuracy}%</p>
          </Card>

          <Card className='border shadow-sm text-center py-4 bg-white'>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>
              Time Taken
            </p>
            <p className='text-3xl font-extrabold text-amber-600 mt-1'>{activeData.timeTaken}</p>
          </Card>
        </div>

        {/* Quick Results Summary Row */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Card className='border shadow-sm bg-indigo-50/40 text-center py-4'>
            <p className='text-xs font-semibold text-indigo-700 uppercase tracking-wider'>
              Foundation Score
            </p>
            <p className='text-2xl font-bold text-indigo-900 mt-1'>
              {activeData.foundationScore}{' '}
              <span className='text-sm font-normal text-indigo-500'>/ 40</span>
            </p>
          </Card>

          <Card className='border shadow-sm bg-emerald-50/40 text-center py-4'>
            <p className='text-xs font-semibold text-emerald-700 uppercase tracking-wider'>
              Coding Problems Solved
            </p>
            <p className='text-2xl font-bold text-emerald-900 mt-1'>
              {activeData.codingSolved}{' '}
              <span className='text-sm font-normal text-emerald-500'>/ 2 Solved</span>
            </p>
          </Card>

          <Card
            className={`border shadow-sm text-center py-4 flex items-center justify-center ${
              selectedTier === 'PRIME'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : selectedTier === 'DIGITAL'
                  ? 'bg-purple-50 text-purple-900 border-purple-200'
                  : selectedTier === 'NINJA'
                    ? 'bg-blue-50 text-blue-900 border-blue-200'
                    : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            <div>
              <p className='text-xs font-semibold uppercase tracking-wider opacity-80'>
                TCS Qualification Status
              </p>
              <Badge
                className={`mt-1.5 px-4 py-1 text-base font-extrabold tracking-wide uppercase ${
                  selectedTier === 'PRIME'
                    ? 'bg-amber-500 text-white'
                    : selectedTier === 'DIGITAL'
                      ? 'bg-purple-600 text-white'
                      : selectedTier === 'NINJA'
                        ? 'bg-blue-600 text-white'
                        : 'bg-red-600 text-white'
                }`}
              >
                {selectedTier === 'NOT_QUALIFIED' ? 'FAIL / NOT QUALIFIED' : selectedTier}
              </Badge>
            </div>
          </Card>
        </div>

        {/* Detailed TCS Hiring Evaluation Card Component */}
        <HiringEvaluationCard
          qualification={activeData.qualification}
          qualificationReason={activeData.qualificationReason}
          evaluationStrategy={activeData.evaluationStrategy}
          foundationScore={activeData.foundationScore}
          advancedScore={activeData.advancedScore}
          codingSolved={activeData.codingSolved}
          qualificationDetails={activeData.qualificationDetails}
        />

        {/* --- IMAGE 1 CARD: Coding Evaluation Summary --- */}
        <Card className='border shadow-sm bg-white overflow-hidden'>
          <CardHeader className='pb-4 flex flex-row items-center justify-between border-b'>
            <div>
              <CardTitle className='text-xl font-bold flex items-center gap-2'>
                <div className='p-2 rounded-lg bg-indigo-50 text-indigo-600'>
                  <Terminal className='h-5 w-5' />
                </div>
                Coding Evaluation Summary
              </CardTitle>
              <CardDescription className='mt-1 text-slate-500'>
                Automated AI evaluation of code compilation, test cases, and functional correctness
              </CardDescription>
            </div>
            <Badge className='bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5 px-3 py-1 font-medium'>
              <CheckCircle2 className='h-3.5 w-3.5 text-emerald-600' /> Evaluation Completed
            </Badge>
          </CardHeader>

          <CardContent className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 items-start'>
              {/* Left Column: Score & Accuracy */}
              <div className='space-y-6'>
                <div>
                  <p className='text-xs font-semibold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5 mb-2'>
                    <Code className='h-4 w-4' /> TECHNICAL SCORE & ACCURACY
                  </p>
                  <p className='text-4xl font-extrabold text-emerald-600 tracking-tight'>
                    {activeData.codingScore}
                  </p>
                </div>

                <div className='p-4 border rounded-xl bg-slate-50/50 space-y-3'>
                  <div className='flex justify-between items-center text-sm font-semibold'>
                    <span className='text-slate-700'>Coding Section Accuracy</span>
                    <span className='text-amber-600'>{activeData.codingAccuracy}%</span>
                  </div>
                  <div className='w-full bg-slate-200 rounded-full h-2.5 overflow-hidden'>
                    <div
                      className='bg-indigo-600 h-2.5 rounded-full transition-all duration-500'
                      style={{ width: `${activeData.codingAccuracy}%` }}
                    />
                  </div>
                  <div className='flex justify-between items-center text-xs font-medium pt-1'>
                    <span className='text-emerald-600 flex items-center gap-1'>
                      <CheckCircle2 className='h-3.5 w-3.5' /> {activeData.codingPassed} Passed
                    </span>
                    <span className='text-red-500 flex items-center gap-1'>
                      <XCircle className='h-3.5 w-3.5' /> {activeData.codingFailed} Failed
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Automated Criteria Dark Box & Warning Banner */}
              <div className='space-y-4'>
                <div className='bg-slate-950 text-white rounded-xl p-5 shadow-inner space-y-4 border border-slate-800'>
                  <p className='text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5'>
                    <Sparkles className='h-4 w-4 text-amber-400' /> AUTOMATED EVALUATION CRITERIA
                  </p>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-800'>
                      <span className='text-slate-300'>Functional Correctness</span>
                      <span className='font-bold text-emerald-400'>
                        {activeData.functionalCorrectness}
                      </span>
                    </div>
                    <div className='flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-800'>
                      <span className='text-slate-300'>Test Case Suite</span>
                      <span className='font-bold text-emerald-400'>{activeData.testCaseSuite}</span>
                    </div>
                    <div className='flex justify-between items-center bg-slate-900 p-2.5 rounded-lg border border-slate-800'>
                      <span className='text-slate-300'>Compilation & Constraints</span>
                      <span className='font-bold text-emerald-400 flex items-center gap-1'>
                        <Check className='h-4 w-4' /> Verified
                      </span>
                    </div>
                  </div>
                </div>

                <div className='bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3'>
                  <AlertCircle className='h-5 w-5 text-amber-600 shrink-0 mt-0.5' />
                  <p className='text-xs text-amber-800 leading-relaxed font-medium'>
                    Code compiled and passed core test cases. Double-check edge cases and constraint
                    handling to maximize score.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- IMAGE 2 CARDS: Section & Topic Accuracy Breakdown & Section-wise Time & Pacing Analysis --- */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Card 1: Section & Topic Accuracy Breakdown */}
          <Card className='border shadow-sm bg-white p-6 space-y-6'>
            <div>
              <CardTitle className='text-lg font-bold flex items-center gap-2'>
                <Target className='h-5 w-5 text-indigo-600' />
                Section & Topic Accuracy Breakdown
              </CardTitle>
              <CardDescription className='text-xs text-slate-500 mt-1'>
                Comprehensive accuracy statistics per section and sub-topic
              </CardDescription>
            </div>

            {/* Reasoning Section Block */}
            <div className='space-y-3 p-4 border rounded-xl bg-slate-50/50'>
              <div className='flex justify-between items-center'>
                <span className='font-bold text-slate-900'>Reasoning</span>
                <Badge
                  variant='outline'
                  className='bg-red-50 text-red-600 border-red-200 font-bold'
                >
                  {activeData.reasoningAccuracy}
                </Badge>
              </div>

              <div className='flex items-center gap-4 text-xs font-medium text-slate-500'>
                <span className='text-emerald-600'>✓ {activeData.reasoningCorrect} Correct</span>
                <span>⊖ {activeData.reasoningSkipped} Skipped</span>
                <span className='text-red-500'>✕ {activeData.reasoningWrong} Wrong</span>
              </div>

              <div className='space-y-2 pt-2 border-t text-xs'>
                <p className='font-semibold text-slate-400 uppercase tracking-wider text-[10px]'>
                  TOPIC-LEVEL ACCURACY
                </p>
                <div className='flex justify-between items-center p-2 rounded bg-white border'>
                  <span className='text-slate-700'>Blood Relation</span>
                  <span className='font-bold text-red-500'>
                    {activeData.reasoningCorrect > 10 ? '90%' : '0%'}
                  </span>
                </div>
                <div className='flex justify-between items-center p-2 rounded bg-white border'>
                  <span className='text-slate-700'>Direction</span>
                  <span className='font-bold text-red-500'>
                    {activeData.reasoningCorrect > 10 ? '80%' : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Coding Section Block */}
            <div className='space-y-3 p-4 border rounded-xl bg-slate-50/50'>
              <div className='flex justify-between items-center'>
                <span className='font-bold text-slate-900'>Coding</span>
                <Badge
                  variant='outline'
                  className='bg-amber-50 text-amber-600 border-amber-200 font-bold'
                >
                  {activeData.codingAccuracy}%
                </Badge>
              </div>

              <div className='w-full bg-slate-200 rounded-full h-2 overflow-hidden'>
                <div
                  className='bg-indigo-600 h-2 rounded-full'
                  style={{ width: `${activeData.codingAccuracy}%` }}
                />
              </div>

              <div className='flex items-center gap-4 text-xs font-medium text-slate-500'>
                <span className='text-emerald-600'>✓ {activeData.codingPassed} Correct</span>
                <span>⊖ {2 - activeData.codingPassed} Skipped</span>
                <span className='text-red-500'>✕ {activeData.codingFailed} Wrong</span>
              </div>

              <div className='space-y-2 pt-2 border-t text-xs'>
                <p className='font-semibold text-slate-400 uppercase tracking-wider text-[10px]'>
                  TOPIC-LEVEL ACCURACY
                </p>
                <div className='flex justify-between items-center p-2 rounded bg-white border'>
                  <span className='text-slate-700'>Basic Coding</span>
                  <span className='font-bold text-amber-600'>{activeData.codingAccuracy}%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Section-wise Time & Pacing Analysis */}
          <Card className='border shadow-sm bg-white p-6 space-y-6'>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-lg font-bold flex items-center gap-2'>
                  <Clock className='h-5 w-5 text-indigo-600' />
                  Section-wise Time & Pacing Analysis
                </CardTitle>
                <CardDescription className='text-xs text-slate-500 mt-1'>
                  Detailed breakdown of duration spent, speed per question, and efficiency per
                  section
                </CardDescription>
              </div>
              <Badge className='bg-indigo-50 text-indigo-700 border-indigo-200 font-bold text-xs'>
                ⚡ 100% Time Efficiency
              </Badge>
            </div>

            {/* Reasoning Time Block */}
            <div className='space-y-3 p-4 border rounded-xl bg-slate-50/50'>
              <div className='flex justify-between items-center'>
                <span className='font-bold text-slate-900'>Reasoning</span>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant='outline'
                    className='bg-red-50 text-red-600 border-red-200 text-xs font-bold'
                  >
                    {activeData.reasoningAccuracy} Accuracy
                  </Badge>
                  <Badge variant='outline' className='text-xs text-slate-400'>
                    N/A
                  </Badge>
                </div>
              </div>

              <p className='text-xs text-slate-500 font-medium'>
                Time Spent:{' '}
                <span className='font-bold text-slate-900'>{activeData.reasoningTimeSpent}</span> of
                30m expected
              </p>

              <div className='grid grid-cols-3 gap-2 text-center text-xs pt-1'>
                <div className='bg-white p-2 rounded border'>
                  <p className='text-[10px] text-slate-400'>Spent</p>
                  <p className='font-bold text-slate-900 mt-0.5'>{activeData.reasoningTimeSpent}</p>
                </div>
                <div className='bg-white p-2 rounded border'>
                  <p className='text-[10px] text-slate-400'>Expected</p>
                  <p className='font-bold text-slate-900 mt-0.5'>30m</p>
                </div>
                <div className='bg-white p-2 rounded border'>
                  <p className='text-[10px] text-slate-400'>Avg Speed</p>
                  <p className='font-bold text-indigo-600 mt-0.5'>0s/q</p>
                </div>
              </div>

              <div className='p-2.5 rounded bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-800 font-medium'>
                🎯{' '}
                {activeData.reasoningTimeSpent === '0m' && activeData.reasoningCorrect === 0
                  ? 'Section not attempted'
                  : 'Pacing within optimal limits'}
              </div>
            </div>

            {/* Coding Time Block */}
            <div className='space-y-3 p-4 border rounded-xl bg-slate-50/50'>
              <div className='flex justify-between items-center'>
                <span className='font-bold text-slate-900'>Coding</span>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant='outline'
                    className='bg-amber-50 text-amber-600 border-amber-200 text-xs font-bold'
                  >
                    {activeData.codingAccuracy}% Accuracy
                  </Badge>
                  <Badge
                    variant='outline'
                    className='bg-blue-50 text-blue-600 border-blue-200 text-xs font-bold'
                  >
                    Good
                  </Badge>
                </div>
              </div>

              <p className='text-xs text-slate-500 font-medium'>
                Time Spent:{' '}
                <span className='font-bold text-slate-900'>{activeData.codingTimeSpent}</span> of
                30m expected
              </p>

              <div className='grid grid-cols-3 gap-2 text-center text-xs pt-1'>
                <div className='bg-white p-2 rounded border'>
                  <p className='text-[10px] text-slate-400'>Spent</p>
                  <p className='font-bold text-slate-900 mt-0.5'>{activeData.codingTimeSpent}</p>
                </div>
                <div className='bg-white p-2 rounded border'>
                  <p className='text-[10px] text-slate-400'>Expected</p>
                  <p className='font-bold text-slate-900 mt-0.5'>30m</p>
                </div>
                <div className='bg-white p-2 rounded border'>
                  <p className='text-[10px] text-slate-400'>Avg Speed</p>
                  <p className='font-bold text-indigo-600 mt-0.5'>{activeData.codingPace}</p>
                </div>
              </div>

              <div className='p-2.5 rounded bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-800 font-medium'>
                ⚡ {activeData.codingStatusText}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
