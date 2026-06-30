import { Injectable, Logger } from "@nestjs/common";
import { WorkflowStep, ExamWorkflow, WorkflowStatus } from "@prisma/client";
import {
  NextAction,
  StepStatus,
  WorkflowStatusDto,
} from "../dto/workflow-status.dto";
import { PrismaService } from "../../../prisma/prisma.service";

/**
 * Aggregates workflow status by calling external module services.
 * Following strict module isolation, this service should inject external services.
 * Since we need to access cross-module data, we abstract it here.
 */
@Injectable()
export class WorkflowStatusService {
  private readonly logger = new Logger(WorkflowStatusService.name);

  constructor(
    // In a real strictly isolated app, we'd inject:
    // private readonly configService: ExamConfigService,
    // private readonly generationService: GenerationService,
    // private readonly reviewService: QuestionReviewService,
    // private readonly assemblyService: AssemblyService,
    private readonly prisma: PrismaService,
  ) {}

  async aggregateStatus(
    workflow: ExamWorkflow,
  ): Promise<
    Omit<
      WorkflowStatusDto,
      "nextAction" | "currentStep" | "completionPercentage" | "status"
    >
  > {
    const examId = workflow.examId;

    // 1. Configuration Status
    const configStatus = await this.getConfigurationStatus(
      examId,
      workflow.currentStep,
    );

    // 2. Generation Status
    const generationStatus = await this.getGenerationStatus(
      examId,
      workflow.currentStep,
    );

    // 3. Review Status
    const reviewStatus = await this.getReviewStatus(
      examId,
      workflow.currentStep,
    );

    // 4. Assembly Status
    const assemblyStatus = await this.getAssemblyStatus(
      examId,
      workflow.currentStep,
    );

    // 5. Publishing Status (pass workflow status so COMPLETED workflows show publishing as done)
    const publishingStatus = await this.getPublishingStatus(
      examId,
      workflow.currentStep,
      workflow.status,
    );

    return {
      configuration: configStatus,
      questionGeneration: generationStatus,
      questionReview: reviewStatus,
      assembly: assemblyStatus,
      publishing: publishingStatus,
    };
  }

  // --- Abstracted integrations ---
  // In a fully decoupled architecture, these would call the injected module services.

  private async getConfigurationStatus(
    examId: string,
    currentStep: WorkflowStep,
  ): Promise<StepStatus> {
    try {
      const config = await this.prisma.examConfig.findUnique({
        where: { id: examId },
      });
      if (!config) {
        return this.buildStepStatus("NOT_STARTED", 0);
      }
      if (config.status !== "DRAFT") {
        return this.buildStepStatus("COMPLETED", 100);
      }
      return this.buildStepStatus("IN_PROGRESS", 50);
    } catch (e) {
      this.logger.error("Error fetching config status", e);
      return this.buildStepStatus("BLOCKED", 0, "Service unavailable");
    }
  }

  private async getGenerationStatus(
    examId: string,
    currentStep: WorkflowStep,
  ): Promise<StepStatus> {
    if (this.isStepBefore(currentStep, WorkflowStep.QUESTION_GENERATION)) {
      return this.buildStepStatus("NOT_STARTED", 0);
    }

    try {
      // Mock question count for now since relation might need a join or different path
      const questionCount = 10;

      if (currentStep === WorkflowStep.QUESTION_GENERATION) {
        return this.buildStepStatus(
          questionCount > 0 ? "COMPLETED" : "IN_PROGRESS",
          questionCount > 0 ? 100 : 50,
        );
      }
      return this.buildStepStatus(
        questionCount > 0 ? "COMPLETED" : "NOT_STARTED",
        questionCount > 0 ? 100 : 0,
      );
    } catch (e) {
      return this.buildStepStatus("BLOCKED", 0, "Service unavailable");
    }
  }

  private async getReviewStatus(
    examId: string,
    currentStep: WorkflowStep,
  ): Promise<StepStatus> {
    if (this.isStepBefore(currentStep, WorkflowStep.QUESTION_REVIEW)) {
      return this.buildStepStatus("NOT_STARTED", 0);
    }

    try {
      // Mock stats for now
      const totalQuestions = 10;
      const approvedQuestions = 10;

      const progress =
        totalQuestions > 0
          ? Math.floor((approvedQuestions / totalQuestions) * 100)
          : 0;

      if (currentStep === WorkflowStep.QUESTION_REVIEW) {
        return this.buildStepStatus(
          progress >= 100 ? "COMPLETED" : "IN_PROGRESS",
          progress,
        );
      }

      return this.buildStepStatus(
        progress >= 100 ? "COMPLETED" : "NOT_STARTED",
        progress,
      );
    } catch (e) {
      return this.buildStepStatus("BLOCKED", 0, "Service unavailable");
    }
  }

  private async getAssemblyStatus(
    examId: string,
    currentStep: WorkflowStep,
  ): Promise<StepStatus> {
    if (this.isStepBefore(currentStep, WorkflowStep.ASSEMBLY)) {
      return this.buildStepStatus("NOT_STARTED", 0);
    }

    // If we are past the ASSEMBLY step (PUBLISHING or COMPLETED), assembly is done
    if (
      currentStep === WorkflowStep.PUBLISHING ||
      currentStep === WorkflowStep.COMPLETED
    ) {
      return this.buildStepStatus("COMPLETED", 100);
    }

    try {
      const assembly = await this.prisma.assembledTest.findFirst({
        where: { configId: examId },
        orderBy: { createdAt: "desc" },
      });

      if (assembly) {
        return this.buildStepStatus("COMPLETED", 100);
      }

      return this.buildStepStatus(
        currentStep === WorkflowStep.ASSEMBLY ? "IN_PROGRESS" : "NOT_STARTED",
        0,
      );
    } catch (e) {
      return this.buildStepStatus("BLOCKED", 0, "Service unavailable");
    }
  }

  private async getPublishingStatus(
    examId: string,
    currentStep: WorkflowStep,
    workflowStatus?: string,
  ): Promise<StepStatus> {
    if (
      this.isStepBefore(currentStep, WorkflowStep.PUBLISHING) &&
      currentStep !== WorkflowStep.COMPLETED
    ) {
      return this.buildStepStatus("NOT_STARTED", 0);
    }

    // If the whole workflow is COMPLETED, publishing is definitely done
    if (
      workflowStatus === "COMPLETED" ||
      currentStep === WorkflowStep.COMPLETED
    ) {
      return this.buildStepStatus("COMPLETED", 100);
    }

    try {
      const assembly = await this.prisma.assembledTest.findFirst({
        where: { configId: examId, status: "PUBLISHED" },
      });

      if (assembly) {
        return this.buildStepStatus("COMPLETED", 100);
      }

      return this.buildStepStatus(
        currentStep === WorkflowStep.PUBLISHING ? "IN_PROGRESS" : "NOT_STARTED",
        0,
      );
    } catch (e) {
      return this.buildStepStatus("BLOCKED", 0, "Service unavailable");
    }
  }

  private buildStepStatus(
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "BLOCKED",
    progress: number,
    errorReason: string | null = null,
  ): StepStatus {
    return {
      status,
      progress,
      startedAt: status !== "NOT_STARTED" ? new Date().toISOString() : null, // Mock timestamps
      finishedAt: status === "COMPLETED" ? new Date().toISOString() : null,
      errorReason,
    };
  }

  private isStepBefore(current: WorkflowStep, target: WorkflowStep): boolean {
    const order = [
      WorkflowStep.CONFIGURATION,
      WorkflowStep.QUESTION_GENERATION,
      WorkflowStep.QUESTION_REVIEW,
      WorkflowStep.ASSEMBLY,
      WorkflowStep.PUBLISHING,
      WorkflowStep.COMPLETED,
    ];
    return order.indexOf(current) < order.indexOf(target);
  }
}
