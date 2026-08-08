import { HiringEvaluationResultDto } from "@intervu-ai/contracts";

export interface HiringSectionMappingContext {
  sectionCode: string;
  sectionName?: string | null;
  mappingType:
    | "NUMERICAL"
    | "VERBAL"
    | "REASONING"
    | "ADVANCED_APTITUDE"
    | "CODING";
  minimumCorrectAnswers: number;
}

export interface HiringEvaluationConfigContext {
  id?: string;
  examConfigId: string;
  strategy: string;
  enabled: boolean;
  ninjaThreshold: number;
  digitalThreshold: number;
  primeThreshold: number;
  advancedDigitalMin: number;
  advancedPrimeMin: number;
  codingTotalProblems: number;
  codingDigitalMinSolved: number;
  codingPrimeMinSolved: number;
  sectionMappings: HiringSectionMappingContext[];
}

export interface SectionScoreContext {
  sectionKey: string;
  sectionName: string;
  correct: number;
  incorrect: number;
  totalQuestions?: number;
}

export interface QuestionEvalContext {
  questionId: string;
  sectionKey?: string;
  isCorrect: boolean;
  score?: number;
  candidateAnswer?: string;
}

export interface CodingEvalContext {
  questionId: string;
  sectionKey?: string;
  score: number; // 0 - 100 percentage
  isCorrect: boolean;
  candidateAnswer?: string;
}

export interface HiringEvaluationContext {
  config: HiringEvaluationConfigContext;
  sectionScores: SectionScoreContext[];
  objectiveEvalResults: QuestionEvalContext[];
  codingEvalResults: CodingEvalContext[];
}

export interface IHiringEvaluationStrategy {
  readonly strategyType: string;
  evaluate(
    context: HiringEvaluationContext,
  ): Promise<HiringEvaluationResultDto>;
}
