import { Injectable } from '@nestjs/common';
import {
  ExecutionReadyTestDto,
  ExecutionSectionDto,
  ExecutionQuestionDto,
} from '../../assembly/contracts/execution-ready.contract';
import {
  RuntimeTestDto,
  RuntimeSectionDto,
  RuntimeQuestionDto,
} from '../dto/runtime.dto';

@Injectable()
export class RuntimeMapperService {
  mapPackageToRuntime(packagedTest: ExecutionReadyTestDto): RuntimeTestDto {
    return {
      testId: packagedTest.assemblyId,
      title: `Test ${packagedTest.assemblyId}`,
      duration: packagedTest.totalDurationSeconds,
      metadata: packagedTest.metadata || {},
      sections: packagedTest.sections.map((section) =>
        this.mapSection(section),
      ),
    };
  }

  private mapSection(section: ExecutionSectionDto): RuntimeSectionDto {
    return {
      sectionId: section.sectionKey,
      title: section.displayName,
      duration: section.durationSeconds,
      questionCount: section.questionCount,
      questions: section.questions.map((question) =>
        this.mapQuestion(question),
      ),
    };
  }

  private mapQuestion(question: ExecutionQuestionDto): RuntimeQuestionDto {
    return {
      questionId: question.questionId,
      questionType: question.questionType,
      questionText: question.questionText,
      options: Array.isArray(question.options) ? question.options : [],
      metadata: {
        difficulty: question.difficulty,
        topicId: question.topicId,
        questionOrder: question.questionOrder,
        ...(typeof question.snapshot === 'object' && question.snapshot !== null
          ? question.snapshot
          : {}),
      },
    };
  }
}
