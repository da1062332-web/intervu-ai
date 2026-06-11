import { AllocatedQuestionDto } from "./allocated-question.dto";

export interface SectionDto {
  sectionKey: string;
  sectionName: string;
  durationSeconds: number;
  orderIndex: number;
  questionCount: number;
  questions: AllocatedQuestionDto[];
}
