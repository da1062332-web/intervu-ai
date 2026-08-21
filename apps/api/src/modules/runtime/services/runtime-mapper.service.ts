import { Injectable } from "@nestjs/common";
import {
  ExecutionReadyTestDto,
  ExecutionSectionDto,
  ExecutionQuestionDto,
} from "../../assembly/contracts/execution-ready.contract";
import {
  RuntimeTestDto,
  RuntimeSectionDto,
  RuntimeQuestionDto,
} from "../dto/runtime.dto";

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
    const snapshot =
      typeof question.snapshot === "object" && question.snapshot !== null
        ? (question.snapshot as Record<string, unknown>)
        : {};

    let questionType = question.questionType;
    if (
      snapshot["codingData"] ||
      snapshot["starterCode"] ||
      snapshot["problemType"] ||
      questionType === "CODING"
    ) {
      questionType = "CODING";
    }

    return {
      questionId: question.questionId,
      questionType,
      questionText: question.questionText,
      options: Array.isArray(question.options) ? question.options : [],
      metadata: {
        difficulty: question.difficulty,
        topicId: question.topicId,
        questionOrder: question.questionOrder,
        ...snapshot,
      },
    };
  }
}
