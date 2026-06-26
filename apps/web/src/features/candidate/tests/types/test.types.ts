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

export interface ValidationResponse {
  isEligible: boolean;
  errors: string[];
}

export interface TestConfig {
  id: string;
  company: string | null;
  title: string;
  difficulty: string;
  durationMinutes: number | null;
  sections: string[];
}
