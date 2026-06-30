import { Injectable } from "@nestjs/common";
import { WorkflowStep, WorkflowStatus } from "@prisma/client";
import { NextAction, WorkflowStatusDto } from "../dto/workflow-status.dto";

@Injectable()
export class WorkflowNextActionService {
  getNextAction(statusDto: Omit<WorkflowStatusDto, "nextAction">): NextAction {
    const { currentStep, status } = statusDto;

    if (status === WorkflowStatus.FAILED) {
      return {
        label: "Retry Stage",
        route: `/admin/workflows/${statusDto.configuration?.errorReason ? "error" : "retry"}`,
        actionKey: "retry",
      };
    }

    if (status === WorkflowStatus.COMPLETED) {
      return {
        label: "View Published Test",
        route: `/admin/publishing`,
        actionKey: "view",
      };
    }

    switch (currentStep) {
      case WorkflowStep.CONFIGURATION:
        return {
          label: "Start Generation",
          route: `/admin/workflows/current/generation`,
          actionKey: "advance",
        };

      case WorkflowStep.QUESTION_GENERATION:
        if (statusDto.questionGeneration.status === "COMPLETED") {
          return {
            label: "Start Review",
            route: `/admin/workflows/current/review`,
            actionKey: "advance",
          };
        }
        return {
          label: "Generate Questions",
          route: `/admin/workflows/current/generation`,
          actionKey: "generate",
        };

      case WorkflowStep.QUESTION_REVIEW:
        if (statusDto.questionReview.status === "COMPLETED") {
          return {
            label: "Assemble Test",
            route: `/admin/workflows/current/assembly`,
            actionKey: "advance",
          };
        }
        return {
          label: "Review Queue",
          route: `/admin/review`,
          actionKey: "open-review",
        };

      case WorkflowStep.ASSEMBLY:
        if (statusDto.assembly.status === "COMPLETED") {
          return {
            label: "Go to Publishing",
            route: `/admin/workflows/current/publish`,
            actionKey: "advance",
          };
        }
        return {
          label: "Generate Assembly",
          route: `/admin/workflows/current/assembly`,
          actionKey: "assemble",
        };

      case WorkflowStep.PUBLISHING:
        return {
          label: "Publish Test",
          route: `/admin/workflows/current/publish`,
          actionKey: "publish",
        };

      default:
        return {
          label: "View Status",
          route: `/admin/workflows`,
          actionKey: "view",
        };
    }
  }
}
