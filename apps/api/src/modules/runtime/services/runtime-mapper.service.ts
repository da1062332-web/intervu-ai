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

import { MediaAssetService } from "../../storage/services/media-asset.service";

@Injectable()
export class RuntimeMapperService {
  constructor(private readonly mediaAssetService: MediaAssetService) {}

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

    // Resolve question diagram media
    let media: Array<{ id: string; type: string; url: string; altText?: string }> | undefined;
    if (Array.isArray(snapshot["questionMedia"])) {
      media = (snapshot["questionMedia"] as any[])
        .map((qm) => {
          const asset = qm.mediaAsset;
          if (asset && asset.storageKey) {
            return {
              id: asset.id,
              type: asset.type || "IMAGE",
              url: this.mediaAssetService.resolveUrl(asset.storageKey),
              altText: asset.altText || undefined,
            };
          }
          return null;
        })
        .filter(Boolean) as any;
    }

    // Resolve options (rich or legacy string array)
    let options: any[] = Array.isArray(question.options) ? question.options : [];
    const mcqDataOptions = (snapshot["mcqData"] as any)?.options;
    if (Array.isArray(mcqDataOptions) && mcqDataOptions.length > 0) {
      options = mcqDataOptions.map((opt: any) => {
        if (typeof opt === "object" && opt !== null) {
          return {
            key: opt.key,
            text: opt.text ?? null,
            mediaId: opt.mediaId ?? null,
            mediaUrl: opt.mediaUrl ?? null,
          };
        }
        return opt;
      });
    }

    return {
      questionId: question.questionId,
      questionType,
      questionText: question.questionText,
      options,
      media: media && media.length > 0 ? media : undefined,
      metadata: {
        difficulty: question.difficulty,
        topicId: question.topicId,
        questionOrder: question.questionOrder,
        ...snapshot,
      },
    };
  }
}
