import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowStep } from '@prisma/client';
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
export class WorkflowEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitConfigurationCompleted(examId: string): void {
    this.eventEmitter.emit('workflow.configuration.completed', new ConfigurationCompletedEvent(examId));
  }

  emitGenerationStarted(examId: string): void {
    this.eventEmitter.emit('workflow.generation.started', new GenerationStartedEvent(examId));
  }

  emitGenerationCompleted(examId: string, questionCount: number): void {
    this.eventEmitter.emit('workflow.generation.completed', new GenerationCompletedEvent(examId, questionCount));
  }

  emitReviewCompleted(examId: string): void {
    this.eventEmitter.emit('workflow.review.completed', new ReviewCompletedEvent(examId));
  }

  emitAssemblyCompleted(examId: string): void {
    this.eventEmitter.emit('workflow.assembly.completed', new AssemblyCompletedEvent(examId));
  }

  emitPublishingCompleted(examId: string): void {
    this.eventEmitter.emit('workflow.publishing.completed', new PublishingCompletedEvent(examId));
  }

  emitWorkflowCompleted(examId: string): void {
    this.eventEmitter.emit('workflow.completed', new WorkflowCompletedEvent(examId));
  }

  emitWorkflowFailed(examId: string, reason: string): void {
    this.eventEmitter.emit('workflow.failed', new WorkflowFailedEvent(examId, reason));
  }

  emitWorkflowRetry(examId: string, step: WorkflowStep): void {
    this.eventEmitter.emit('workflow.retry', new WorkflowRetryEvent(examId, step));
  }
}
