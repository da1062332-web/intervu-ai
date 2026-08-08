export interface StyleCharacteristic {
  name: string;
  value: unknown;
}

export interface LanguageStyle {
  language: string;
  sentenceLength: string;
  vocabularyLevel: string;
  grammarStyle: string;
}

export interface ContextStyle {
  preferredContexts: string[];
}

export interface WordingDifficulty {
  easy: string[];
  medium: string[];
  hard: string[];
}

export interface DistractorRules {
  exactlyFourOptions: boolean;
  oneCorrectAnswer: boolean;
  plausibleIncorrectOptions: boolean;
  avoidObviouslyWrongOptions: boolean;
  avoidHumorousOptions: boolean;
  representCommonStudentMistakes: boolean;
}

export interface ExplanationStyle {
  formulaFirst: boolean;
  stepWiseSolution: boolean;
  maxSteps: number;
  explanationLength: string;
  highlightFinalAnswer: boolean;
}

export interface StyleProfile {
  id: string;
  name: string;
  description?: string | null;
  profileType: "campus" | "lateral" | "executive" | "certification";
  characteristics: StyleCharacteristic[];
  active: boolean;
  status: "ACTIVE" | "INACTIVE";
  isDefault: boolean;
  languageStyle: LanguageStyle;
  contextStyle: ContextStyle;
  difficultyStyle: WordingDifficulty;
  distractorRules: DistractorRules;
  explanationStyle: ExplanationStyle;
  aiInstructions: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateStyleProfile {
  name: string;
  description?: string | null;
  profileType?: "campus" | "lateral" | "executive" | "certification";
  characteristics?: StyleCharacteristic[];
  active?: boolean;
  status?: "ACTIVE" | "INACTIVE";
  isDefault?: boolean;
  languageStyle?: Partial<LanguageStyle>;
  contextStyle?: Partial<ContextStyle>;
  difficultyStyle?: Partial<WordingDifficulty>;
  distractorRules?: Partial<DistractorRules>;
  explanationStyle?: Partial<ExplanationStyle>;
  aiInstructions?: string;
}

export interface UpdateStyleProfile {
  name?: string;
  description?: string | null;
  profileType?: "campus" | "lateral" | "executive" | "certification";
  characteristics?: StyleCharacteristic[];
  active?: boolean;
  status?: "ACTIVE" | "INACTIVE";
  isDefault?: boolean;
  languageStyle?: Partial<LanguageStyle>;
  contextStyle?: Partial<ContextStyle>;
  difficultyStyle?: Partial<WordingDifficulty>;
  distractorRules?: Partial<DistractorRules>;
  explanationStyle?: Partial<ExplanationStyle>;
  aiInstructions?: string;
}
