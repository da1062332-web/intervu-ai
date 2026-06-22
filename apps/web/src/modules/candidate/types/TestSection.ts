export interface TestSection {
  id: string;
  name: string;
  questionCount: number;
  durationMinutes: number;
}

export interface InstructionConfig {
  assessmentRules: string[];
  navigationRules: string[];
  timerRules: string[];
  submissionRules: string[];
}
