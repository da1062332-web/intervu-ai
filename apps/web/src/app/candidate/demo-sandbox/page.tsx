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
