import { TestConfig, InstructionConfig, ValidationResponse } from '../types/test.types';

export const mockTestConfig: TestConfig = {
  id: 'tcs-nqt-001',
  company: 'Tata Consultancy Services',
  title: 'TCS NQT Cognitive Assessment',
  description: 'The National Qualifier Test (NQT) assesses cognitive skills, including numerical, verbal, and reasoning abilities. This test is a prerequisite for all TCS hiring processes.',
  totalQuestions: 60,
  durationMinutes: 90,
  difficulty: 'Medium',
  sections: [
    {
      id: 'sec-1',
      name: 'Numerical Ability',
      questionCount: 20,
      durationMinutes: 30,
    },
    {
      id: 'sec-2',
      name: 'Verbal Ability',
      questionCount: 24,
      durationMinutes: 30,
    },
    {
      id: 'sec-3',
      name: 'Reasoning Ability',
      questionCount: 30,
      durationMinutes: 50,
    },
  ],
};

export const mockInstructionConfig: InstructionConfig = {
  assessmentRules: [
    'You must have a stable internet connection throughout the test.',
    'Do not refresh the page or use the browser back button.',
    'Calculators and external aids are not permitted.',
    'You are monitored via webcam and microphone.'
  ],
  navigationRules: [
    'You can navigate between questions within the same section.',
    'Once a section is submitted, you cannot return to it.',
    'Unanswered questions will receive zero marks.'
  ],
  timerRules: [
    'The overall timer runs continuously once the test starts.',
    'Sectional time limits are strictly enforced.',
    'The test will automatically submit when the total time expires.'
  ],
  submissionRules: [
    'Ensure all mandatory sections are completed before final submission.',
    'A summary will be shown before the final submission step.'
  ]
};

export const mockValidationResponseEligible: ValidationResponse = {
  isEligible: true,
  errors: [],
};

export const mockValidationResponseIneligible: ValidationResponse = {
  isEligible: false,
  errors: ['Identity verification incomplete', 'Missing required system permissions'],
};
