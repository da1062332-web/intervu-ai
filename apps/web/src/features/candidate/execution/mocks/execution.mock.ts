import { TestInstance, Section, Question } from '../types/execution.types';

const mockQuantQuestions: Question[] = [
  {
    id: 'q1',
    questionHash: 'hash-q1',
    type: 'NUMERIC',
    text: 'If a train travels at 60 km/h for 3 hours, what is the total distance traveled in km? (Enter a number)',
    options: [],
    orderIndex: 0,
  },
  {
    id: 'q2',
    questionHash: 'hash-q2',
    type: 'MCQ',
    text: 'What is 15% of 200?',
    options: [
      { id: 'q2-opt1', text: '20' },
      { id: 'q2-opt2', text: '30' },
      { id: 'q2-opt3', text: '40' },
      { id: 'q2-opt4', text: '50' },
    ],
    orderIndex: 1,
  },
];

const mockLogicalQuestions: Question[] = [
  {
    id: 'q3',
    questionHash: 'hash-q3',
    type: 'MSQ',
    text: 'Select all the prime numbers from the list below:',
    options: [
      { id: 'q3-opt1', text: '2' },
      { id: 'q3-opt2', text: '4' },
      { id: 'q3-opt3', text: '5' },
      { id: 'q3-opt4', text: '9' },
    ],
    orderIndex: 2,
  },
  {
    id: 'q4',
    questionHash: 'hash-q4',
    type: 'MCQ',
    text: 'Complete the sequence: 2, 4, 8, 16, __',
    options: [
      { id: 'q4-opt1', text: '24' },
      { id: 'q4-opt2', text: '32' },
      { id: 'q4-opt3', text: '64' },
      { id: 'q4-opt4', text: '128' },
    ],
    orderIndex: 3,
  },
];

const mockVerbalQuestions: Question[] = [
  {
    id: 'q5',
    questionHash: 'hash-q5',
    type: 'MCQ',
    text: 'Choose the synonym for "Ubiquitous":',
    options: [
      { id: 'q5-opt1', text: 'Rare' },
      { id: 'q5-opt2', text: 'Omnipresent' },
      { id: 'q5-opt3', text: 'Scanty' },
      { id: 'q5-opt4', text: 'Expensive' },
    ],
    orderIndex: 4,
  },
  {
    id: 'q6',
    questionHash: 'hash-q6',
    type: 'CODING',
    text: 'Write a JavaScript function `isPalindrome(str)` that returns true if a string is a palindrome. (Placeholder for coding editor)',
    options: [],
    orderIndex: 5,
  },
];

const sections: Section[] = [
  {
    id: 'section-1',
    sectionKey: 'quant',
    title: 'Quant',
    questions: mockQuantQuestions,
  },
  {
    id: 'section-2',
    sectionKey: 'logical',
    title: 'Logical',
    questions: mockLogicalQuestions,
  },
  {
    id: 'section-3',
    sectionKey: 'verbal',
    title: 'Verbal',
    questions: mockVerbalQuestions,
  },
];

export const mockTestInstance: TestInstance = {
  id: 'test-inst-123',
  testConfigId: 'config-123',
  userId: 'user-123',
  assessmentName: 'Software Engineering Assessment',
  candidateName: 'John Doe',
  status: 'IN_PROGRESS',
  durationSeconds: 3600, // 60 minutes
  sections: sections,
};
