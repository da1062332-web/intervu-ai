import { TestInstance, Section, Question } from '../types/execution.types';

const generateMockQuestions = (count: number): Question[] => {
  const questions: Question[] = [];


  for (let i = 1; i <= count; i++) {
    const isAptitude = i % 2 !== 0;
    
    let text = '';
    let options = [];
    
    if (isAptitude) {
      text = `If a train travels at ${60 + (i % 5) * 10} km/h for ${2 + (i % 3)} hours, how far does it travel?`;
      const baseAns = (60 + (i % 5) * 10) * (2 + (i % 3));
      options = [
        { id: `q${i}-opt1`, text: `${baseAns - 20} km` },
        { id: `q${i}-opt2`, text: `${baseAns} km` },
        { id: `q${i}-opt3`, text: `${baseAns + 20} km` },
        { id: `q${i}-opt4`, text: `${baseAns + 40} km` }
      ];
    } else {
      text = `Complete the sequence: ${i}, ${i + 2}, ${i + 4}, __`;
      options = [
        { id: `q${i}-opt1`, text: `${i + 5}` },
        { id: `q${i}-opt2`, text: `${i + 6}` },
        { id: `q${i}-opt3`, text: `${i + 7}` },
        { id: `q${i}-opt4`, text: `${i + 8}` }
      ];
    }

    questions.push({
      id: `q${i}`,
      questionHash: `hash-q${i}`,
      text,
      options,
      orderIndex: i - 1
    });
  }
  return questions;
};

const mockQuestions = generateMockQuestions(40);

const mockSection: Section = {
  id: 'section-1',
  sectionKey: 'aptitude-reasoning',
  title: 'Aptitude & Reasoning',
  questions: mockQuestions
};

export const mockTestInstance: TestInstance = {
  id: 'test-inst-123',
  testConfigId: 'config-123',
  userId: 'user-123',
  assessmentName: 'Software Engineering Assessment',
  candidateName: 'John Doe',
  status: 'IN_PROGRESS',
  durationSeconds: 3600, // 60 minutes
  sections: [mockSection]
};
