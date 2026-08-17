'use client';

import React, { useEffect } from 'react';
import { useExecutionStore } from '@/features/candidate/execution/stores/execution.store';
import { ExecutionLayout } from '@/features/candidate/execution/components/ExecutionLayout';
import { TestInstance } from '@/features/candidate/execution/types/execution.types';

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
          type: 'MCQ',
          orderIndex: 2,
          text: 'A sum of money at simple interest amounts to Rs. 815 in 3 years and to Rs. 854 in 4 years. The principal amount is:',
          options: [
            { id: 'opt-3a', text: 'Rs. 650' },
            { id: 'opt-3b', text: 'Rs. 690' },
            { id: 'opt-3c', text: 'Rs. 698' },
            { id: 'opt-3d', text: 'Rs. 700' },
          ],
        },
        {
          id: 'q4',
          questionHash: 'hash-q4',
          type: 'NUMERIC',
          orderIndex: 3,
          stem: 'If 20 men can finish a piece of work in 30 days working 6 hours a day, calculate the number of days in which 15 men will finish it working 8 hours a day.',
          text: 'Type the integer numerical answer (in days) below:',
          options: [],
        },
      ],
    },
    {
      id: 'sec-2',
      sectionKey: 'reasoning',
      sectionName: 'Logical Reasoning',
      title: 'Logical Reasoning',
      questions: [
        {
          id: 'q5',
          questionHash: 'hash-q5',
          type: 'MCQ',
          orderIndex: 4,
          stem: 'Directions: In the following question, three statements are given followed by two conclusions numbered I and II. You have to take the given statements to be true even if they seem to be at variance from commonly known facts.\n\nStatements:\n1. All books are tables.\n2. Some chairs are books.\n3. No table is red.',
          text: 'Which of the conclusions logically follows from the given statements?\n\nConclusion I: Some chairs are tables.\nConclusion II: No book is red.',
          options: [
            { id: 'opt-5a', text: 'Only Conclusion I follows' },
            { id: 'opt-5b', text: 'Only Conclusion II follows' },
            { id: 'opt-5c', text: 'Both Conclusion I and II follow' },
            { id: 'opt-5d', text: 'Neither I nor II follows' },
          ],
        },
        {
          id: 'q6',
          questionHash: 'hash-q6',
          type: 'MCQ',
          orderIndex: 5,
          text: 'In a certain code language, "COMPUTER" is written as "RFUVQNPC". How will "MEDICINE" be written in that code language?',
          options: [
            { id: 'opt-6a', text: 'MFEDJJOE' },
            { id: 'opt-6b', text: 'EOJDEJFM' },
            { id: 'opt-6c', text: 'MFEJDJOE' },
            { id: 'opt-6d', text: 'EOJDJEFM' },
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
      id: 'sec-3',
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
        {
          id: 'q9',
          questionHash: 'hash-q9',
          type: 'MCQ',
          orderIndex: 8,
          text: 'Choose the correct synonym for the word: "EPHEMERAL"',
          options: [
            { id: 'opt-9a', text: 'Permanent' },
            { id: 'opt-9b', text: 'Transient' },
            { id: 'opt-9c', text: 'Formidable' },
            { id: 'opt-9d', text: 'Melancholy' },
          ],
        },
      ],
    },
    {
      id: 'sec-4',
      sectionKey: 'coding',
      sectionName: 'Hands-On Coding & Algorithms',
      title: 'Hands-On Coding & Algorithms',
      questions: [
        {
          id: 'q10',
          questionHash: 'hash-q10',
          type: 'CODING',
          orderIndex: 9,
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
          id: 'q11',
          questionHash: 'hash-q11',
          type: 'CODING',
          orderIndex: 10,
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
  ],
};

export default function DemoSandboxPage() {
  const { initializeTest, setLoading, setError } = useExecutionStore();

  useEffect(() => {
    // Instantiate store directly with rich demo exam data
    initializeTest(mockTestInstance);
    setLoading(false);
    setError(null);
  }, [initializeTest, setLoading, setError]);

  return <ExecutionLayout />;
}
