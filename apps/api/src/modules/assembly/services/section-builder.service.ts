import { Injectable } from "@nestjs/common";
import { BlueprintSectionDto } from "@intervu/shared";
import { AllocatedQuestionDto } from "@intervu/shared";
import { AllocatedSectionDto as SectionDto } from "@intervu/shared";

@Injectable()
export class SectionBuilderService {
  buildSection(
    blueprintSection: BlueprintSectionDto,
    questions: AllocatedQuestionDto[],
  ): SectionDto {
    return {
      sectionKey: blueprintSection.sectionKey,
      displayName: blueprintSection.displayName,
      durationSeconds: blueprintSection.durationSeconds,
      orderIndex: blueprintSection.orderIndex,
      questionCount: questions.length,
      questions: questions,
    };
  }
}
