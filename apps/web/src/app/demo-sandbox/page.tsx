'use client';

import React, { useState } from 'react';
import { useExecutionStore } from '@/features/candidate/execution/stores/execution.store';
import { SandboxRenderer } from '@/features/candidate/execution/components/SandboxRenderer';
import { TestInstance } from '@/features/candidate/execution/types/execution.types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Monitor,
  Layout,
  Terminal,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface SandboxOption {
  id: 'DEFAULT' | 'SANDBOX_2' | 'SANDBOX_3';
  name: string;
  badge: string;
  icon: React.ReactNode;
  tagline: string;
  description: string;
  features: string[];
  themeColor: string;
  buttonClass: string;
}

const SANDBOX_OPTIONS: SandboxOption[] = [
  {
    id: 'DEFAULT',
    name: 'Default Sandbox UI',
    badge: 'Standard CBT • TCS NQT Simulation',
    icon: <Monitor className='w-6 h-6 text-primary' />,
    tagline: 'Standard full-featured proctored candidate interface',
    description:
      'The comprehensive examination interface with multi-section tabs, split problem statement / candidate instructions pane, question palette, real-time proctored timer, scratchpad, calculator, and integrated code compiler.',
    features: [
      'Split Question Stem & Instructions Pane',
      'Interactive Question Matrix Palette',
      'Embedded Monaco Code Editor & Compiler',
      'Floating Scratchpad & Scientific Calculator',
    ],
    themeColor: 'border-primary/30 hover:border-primary',
    buttonClass: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  {
    id: 'SANDBOX_2',
    name: 'Sandbox UI 2',
    badge: 'Variant 2 • Streamlined Modern',
    icon: <Layout className='w-6 h-6 text-indigo-600' />,
    tagline: 'Focused, card-based modern assessment layout',
    description:
      'A sleek, distraction-free interface optimized for multiple-choice questions, screening rounds, and fast navigation with an intuitive question matrix and clean time tracking.',
    features: [
      'Minimalist Card-Based Question Presentation',
      'Streamlined Header Time-Tracking',
      'Compact Question Status Matrix',
      'Distraction-Free Candidate Flow',
    ],
    themeColor: 'border-indigo-300 hover:border-indigo-600',
    buttonClass: 'bg-indigo-600 text-white hover:bg-indigo-700',
  },
  {
    id: 'SANDBOX_3',
    name: 'Sandbox UI 3',
    badge: 'Variant 3 • Developer Dark Theme',
    icon: <Terminal className='w-6 h-6 text-emerald-400' />,
    tagline: 'Immersive dark terminal & IDE environment',
    description:
      'A developer-centric dark theme layout specifically designed for coding rounds, algorithmic challenges, and terminal test execution with syntax highlighting and live test case feedback.',
    features: [
      'Full Dark-Mode Code IDE Environment',
      'Dual-Pane Problem & Terminal Output',
      'Monospace Typography & Syntax Highlighting',
      'Live Test Case Execution & Status Indicators',
    ],
    themeColor: 'border-emerald-500/30 hover:border-emerald-500',
    buttonClass: 'bg-emerald-600 text-slate-950 font-bold hover:bg-emerald-500',
  },
];

const mockTestInstance: TestInstance = {
  id: 'demo-sandbox-test-id',
  testConfigId: 'demo-config-id',
  userId: 'demo-user-101',
  assessmentName: 'TCS NQT Proctored CBT Simulation (Demo Sandbox)',
  candidateName: 'John Doe (Candidate ID: TCS-99821)',
  status: 'IN_PROGRESS',
  durationSeconds: 3600, // 60 minutes
  sectionTimingEnabled: false,
  currentSectionIndex: 0,
  currentQuestionIndex: 0,
  sections: [
    {
      id: 'sec-1',
      sectionKey: 'quant',
      sectionName: 'Quantitative Aptitude',
      title: 'Quantitative Aptitude',
      questions: [
        {
          id: 'q1',
          questionHash: 'hash-q1',
          type: 'MCQ',
          orderIndex: 0,
          stem: 'A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train in meters?',
          candidateInstructions:
            'Use exact formulas for speed, time and distance. Do not round off intermediate fractions.',
          text: 'Based on the train speed and time taken above, select the correct length of the train:',
          options: [
            { id: 'opt-1a', text: '120 metres' },
            { id: 'opt-1b', text: '150 metres' },
            { id: 'opt-1c', text: '180 metres' },
            { id: 'opt-1d', text: '324 metres' },
          ],
        },
        {
          id: 'q2',
          questionHash: 'hash-q2',
          type: 'MCQ',
          orderIndex: 1,
          stem: 'Two pipes A and B can fill a cistern in 37.5 minutes and 45 minutes respectively. Both pipes are opened. The cistern will be filled in just half an hour, if the pipe B is turned off after what time?',
          text: 'Select the correct time after which pipe B must be turned off:',
          options: [
            { id: 'opt-2a', text: '5 minutes' },
            { id: 'opt-2b', text: '9 minutes' },
            { id: 'opt-2c', text: '10 minutes' },
            { id: 'opt-2d', text: '15 minutes' },
          ],
        },
        {
          id: 'q3',
          questionHash: 'hash-q3',
          type: 'NUMERIC',
          orderIndex: 2,
          stem: 'If 20 men can finish a piece of work in 30 days working 6 hours a day, calculate the number of days in which 15 men will finish it working 8 hours a day.',
          text: 'Type the integer numerical answer (in days) below:',
          options: [],
        },
      ],
    },
    {
      id: 'sec-2',
      sectionKey: 'coding',
      sectionName: 'Hands-On Coding & Algorithms',
      title: 'Hands-On Coding & Algorithms',
      questions: [
        {
          id: 'q4',
          questionHash: 'hash-q4',
          type: 'CODING',
          orderIndex: 3,
          stem: '### Pattern: Math & Number Theory (Trial Division / Primality Testing)\n\nGiven an integer `n`, write an efficient algorithm to determine whether `n` is a prime number. A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.',
          text: 'Write a function `isPrime(n)` that returns `true` if `n` is a prime number, and `false` otherwise.',
          options: [],
          candidateInstructions:
            'Consider edge cases such as negative numbers, 0, 1, and large prime values up to 10^9.',
          codingData: {
            patternKey: 'MATH_PRIME_CHECK',
            oracleKey: 'MATH_PRIME_CHECK_ORACLE',
            functionSignature: 'isPrime(n: number): boolean',
            inputDescription: 'n : An integer value where -10^9 <= n <= 10^9.',
            outputDescription: 'Returns true if n is prime, otherwise returns false.',
            constraints: '-10^9 \u2264 n \u2264 10^9\nTime Complexity Goal: O(sqrt(n))\nSpace Complexity Goal: O(1)',
            exampleWalkthrough: [
              { input: 'n = 7', output: 'true' },
              { input: 'n = 10', output: 'false' },
              { input: 'n = 527', output: 'false (527 = 17 * 31)' },
            ],
            publicTests: [
              { input: { n: 7 }, expectedOutput: { result: true } },
              { input: { n: 10 }, expectedOutput: { result: false } },
            ],
          },
        },
        {
          id: 'q5',
          questionHash: 'hash-q5',
          type: 'CODING',
          orderIndex: 4,
          stem: '### Pattern: Array Reversal & Cyclic Shift\n\nGiven an array of integers `arr` and a non-negative integer `k`, rotate the array to the right by `k` steps. The algorithm should handle cases where `k` is larger than the size of the array.',
          text: 'Write an algorithm to rotate array `arr` right by `k` positions and return the rotated array.',
          options: [],
          candidateInstructions:
            'Perform the rotation efficiently. Try to optimize space to O(1) extra memory using the triple-reversal pattern.',
          codingData: {
            patternKey: 'ARRAY_CYCLIC_ROTATION',
            oracleKey: 'ARRAY_ROTATION_ORACLE',
            functionSignature: 'rotateArray(arr: number[], k: number): number[]',
            inputDescription: 'arr : An array of integers. k : Non-negative number of steps to rotate right.',
            outputDescription: 'Returns the array rotated right by k positions.',
            constraints: '1 \u2264 arr.length \u2264 10^5\n0 \u2264 k \u2264 10^9\nTime Complexity Goal: O(N)\nSpace Complexity Goal: O(1)',
            exampleWalkthrough: [
              { input: 'arr = [1, 2, 3, 4, 5], k = 2', output: '[4, 5, 1, 2, 3]' },
              { input: 'arr = [10, 20, 30], k = 1', output: '[30, 10, 20]' },
            ],
            publicTests: [
              {
                input: { arr: [1, 2, 3, 4, 5], k: 2 },
                expectedOutput: { result: [4, 5, 1, 2, 3] },
              },
            ],
          },
        },
      ],
    },
    {
      id: 'sec-3',
      sectionKey: 'reasoning',
      sectionName: 'Logical Reasoning',
      title: 'Logical Reasoning',
      questions: [
        {
          id: 'q6',
          questionHash: 'hash-q6',
          type: 'MCQ',
          orderIndex: 5,
          stem: 'Directions: In the following question, three statements are given followed by two conclusions numbered I and II. You have to take the given statements to be true even if they seem to be at variance from commonly known facts.\n\nStatements:\n1. All books are tables.\n2. Some chairs are books.\n3. No table is red.',
          text: 'Which of the conclusions logically follows from the given statements?\n\nConclusion I: Some chairs are tables.\nConclusion II: No book is red.',
          options: [
            { id: 'opt-6a', text: 'Only Conclusion I follows' },
            { id: 'opt-6b', text: 'Only Conclusion II follows' },
            { id: 'opt-6c', text: 'Both Conclusion I and II follow' },
            { id: 'opt-6d', text: 'Neither I nor II follows' },
          ],
        },
        {
          id: 'q7',
          questionHash: 'hash-q7',
          type: 'MSQ',
          orderIndex: 6,
          stem: 'Multiple Select Question (MSQ): You may select MORE THAN ONE option for this question.',
          text: 'Which of the following numbers are both perfect squares and perfect cubes?',
          options: [
            { id: 'opt-7a', text: '1' },
            { id: 'opt-7b', text: '64' },
            { id: 'opt-7c', text: '4096' },
            { id: 'opt-7d', text: '512' },
          ],
        },
      ],
    },
    {
      id: 'sec-4',
      sectionKey: 'verbal',
      sectionName: 'Verbal & Reading Comprehension',
      title: 'Verbal & Reading Comprehension',
      questions: [
        {
          id: 'q8',
          questionHash: 'hash-q8',
          type: 'MCQ',
          orderIndex: 7,
          stem: 'Read the short passage below and answer the related question:\n\n"Artificial Intelligence has rapidly shifted from academic experimentation into industrial productivity. While classical algorithmic systems relied on strict deterministic rule sets, modern generative models leverage billions of parameters trained over massive unstructured data distributions. The core paradigm challenge today lies in aligning these systems with robust safety standards without diminishing their computational agility."',
          text: 'According to the passage, what is highlighted as the primary challenge facing modern generative AI models today?',
          options: [
            {
              id: 'opt-8a',
              text: 'Gathering enough unstructured data distributions for parameter training',
            },
            {
              id: 'opt-8b',
              text: 'Aligning model outputs with safety standards while preserving computational agility',
            },
            {
              id: 'opt-8c',
              text: 'Replacing deterministic rule sets with academic experimentation',
            },
            {
              id: 'opt-8d',
              text: 'Increasing the billions of parameters to outpace classical algorithmic systems',
            },
          ],
        },
      ],
    },
  ],
};

export default function StandaloneDemoSandboxPage() {
  const [selectedSandbox, setSelectedSandbox] = useState<
    'DEFAULT' | 'SANDBOX_2' | 'SANDBOX_3' | null
  >(null);
  const { initializeTest, setLoading, setError } = useExecutionStore();

  const handleSelectSandbox = (
    sandboxId: 'DEFAULT' | 'SANDBOX_2' | 'SANDBOX_3',
  ) => {
    setSelectedSandbox(sandboxId);
    initializeTest({
      ...mockTestInstance,
      sandboxUi: sandboxId,
    });
    setLoading(false);
    setError(null);
  };

  if (!selectedSandbox) {
    return (
      <div className='min-h-screen bg-slate-50/80 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 font-sans'>
        <div className='max-w-6xl mx-auto space-y-8'>
          {/* Header */}
          <div className='text-center space-y-3 max-w-2xl mx-auto'>
            <Badge
              variant='outline'
              className='px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-white dark:bg-slate-900'
            >
              Live Demo Environment
            </Badge>
            <h1 className='text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white'>
              Candidate Assessment Sandboxes
            </h1>
            <p className='text-slate-600 dark:text-slate-400 text-sm sm:text-base'>
              Choose an assessment UI variant below to explore and test the proctored candidate execution experience.
            </p>
          </div>

          {/* Cards Grid */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 pt-4'>
            {SANDBOX_OPTIONS.map((sandbox) => (
              <Card
                key={sandbox.id}
                className={`p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-lg border-2 cursor-pointer ${sandbox.themeColor} bg-white dark:bg-slate-900`}
                onClick={() => handleSelectSandbox(sandbox.id)}
              >
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center'>
                      {sandbox.icon}
                    </div>
                    <Badge variant='secondary' className='text-[11px] font-medium'>
                      {sandbox.badge}
                    </Badge>
                  </div>

                  <div>
                    <h2 className='text-xl font-bold text-slate-900 dark:text-white'>
                      {sandbox.name}
                    </h2>
                    <p className='text-xs font-medium text-slate-500 mt-1'>
                      {sandbox.tagline}
                    </p>
                  </div>

                  <p className='text-xs text-slate-600 dark:text-slate-300 leading-relaxed'>
                    {sandbox.description}
                  </p>

                  <div className='pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2'>
                    <span className='text-[11px] font-semibold text-slate-400 uppercase tracking-wider'>
                      Key Highlights:
                    </span>
                    <ul className='space-y-1.5'>
                      {sandbox.features.map((feat, idx) => (
                        <li
                          key={idx}
                          className='text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2'
                        >
                          <CheckCircle2 className='w-3.5 h-3.5 text-emerald-500 shrink-0' />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className='pt-6'>
                  <Button
                    className={`w-full gap-2 font-semibold text-xs h-10 ${sandbox.buttonClass}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSandbox(sandbox.id);
                    }}
                  >
                    Launch {sandbox.name} <ArrowRight className='w-4 h-4' />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='relative'>
      {/* Floating UI Switcher Control */}
      <div className='fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900/90 text-white px-3.5 py-2 rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md text-xs font-sans animate-in fade-in slide-in-from-bottom-2'>
        <span className='w-2 h-2 rounded-full bg-emerald-400 animate-pulse' />
        <span className='text-slate-300'>
          Active:{' '}
          <strong className='text-white'>
            {SANDBOX_OPTIONS.find((s) => s.id === selectedSandbox)?.name}
          </strong>
        </span>
        <button
          onClick={() => setSelectedSandbox(null)}
          className='ml-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 text-white font-medium rounded-full transition-colors flex items-center gap-1.5'
        >
          <RotateCcw className='w-3 h-3' /> Switch Sandbox
        </button>
      </div>

      <SandboxRenderer />
    </div>
  );
}
