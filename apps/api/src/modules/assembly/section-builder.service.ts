import { Injectable } from '@nestjs/common';
import { BlueprintSectionDto } from './dto/blueprint.dto';
import { AllocatedQuestionDto } from './dto/allocated-question.dto';
import { SectionDto } from './dto/section.dto';

@Injectable()
export class SectionBuilderService {
  buildSection(
    blueprintSection: BlueprintSectionDto,
    questions: AllocatedQuestionDto[]
  ): SectionDto {
    return {
      sectionKey: blueprintSection.sectionKey,
      sectionName: blueprintSection.displayName,
      durationSeconds: blueprintSection.durationSeconds,
      orderIndex: blueprintSection.orderIndex,
      questionCount: questions.length,
      questions: questions,
    };
  }
}
