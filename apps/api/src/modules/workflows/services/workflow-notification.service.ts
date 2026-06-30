import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConfigurationCompletedEvent,
  GenerationStartedEvent,
  GenerationCompletedEvent,
  ReviewCompletedEvent,
  AssemblyCompletedEvent,
  PublishingCompletedEvent,
  WorkflowCompletedEvent,
  WorkflowFailedEvent,
  WorkflowRetryEvent,
} from '../events/workflow.events';

@Injectable()
export class WorkflowNotificationService {
  private readonly logger = new Logger(WorkflowNotificationService.name);

  @OnEvent('workflow.configuration.completed')
  handleConfigurationCompleted(event: ConfigurationCompletedEvent) {
    this.logger.log(`[Workflow] Configuration completed for exam ${event.examId}`);
  }

  @OnEvent('workflow.generation.started')
  handleGenerationStarted(event: GenerationStartedEvent) {
    this.logger.log(`[Workflow] Question generation started for exam ${event.examId}`);
  }

  @OnEvent('workflow.generation.completed')
  handleGenerationCompleted(event: GenerationCompletedEvent) {
    this.logger.log(
      `[Workflow] Question generation completed for exam ${event.examId}. Generated ${event.questionCount} questions.`,
    );
  }

  @OnEvent('workflow.review.completed')
  handleReviewCompleted(event: ReviewCompletedEvent) {
    this.logger.log(`[Workflow] Review completed for exam ${event.examId}`);
  }

  @OnEvent('workflow.assembly.completed')
  handleAssemblyCompleted(event: AssemblyCompletedEvent) {
    this.logger.log(`[Workflow] Test assembly completed for exam ${event.examId}`);
  }

  @OnEvent('workflow.publishing.completed')
  handlePublishingCompleted(event: PublishingCompletedEvent) {
    this.logger.log(`[Workflow] Test publishing completed for exam ${event.examId}`);
  }

  @OnEvent('workflow.completed')
  handleWorkflowCompleted(event: WorkflowCompletedEvent) {
    this.logger.log(`[Workflow] Entire workflow completed successfully for exam ${event.examId}`);
  }

  @OnEvent('workflow.failed')
  handleWorkflowFailed(event: WorkflowFailedEvent) {
    this.logger.error(`[Workflow] Workflow FAILED for exam ${event.examId}. Reason: ${event.reason}`);
  }

  @OnEvent('workflow.retry')
  handleWorkflowRetry(event: WorkflowRetryEvent) {
    this.logger.log(`[Workflow] Retrying step ${event.step} for exam ${event.examId}`);
  }
}
