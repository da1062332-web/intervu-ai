import { Injectable, Logger } from '@nestjs/common';
import { WorkflowStep } from '@prisma/client';
import { ExamWorkflowService } from '../services/exam-workflow.service';
import { WorkflowStatusService } from '../services/workflow-status.service';
import { WorkflowTransitionGuard } from '../guards/workflow-transition.guard';
import { WorkflowEventPublisher } from '../services/workflow-event-publisher';
import { GenerationOrchestratorService } from '../../generation/services/generation-orchestrator.service';
import { AssemblyService } from '../../assembly/services/test-assembly.service';

@Injectable()
export class ExamWorkflowOrchestrator {
  private readonly logger = new Logger(ExamWorkflowOrchestrator.name);

  constructor(
    private readonly workflowService: ExamWorkflowService,
    private readonly statusService: WorkflowStatusService,
    private readonly transitionGuard: WorkflowTransitionGuard,
    private readonly eventPublisher: WorkflowEventPublisher,
    private readonly generationOrchestrator: GenerationOrchestratorService,
    private readonly assemblyService: AssemblyService,
  ) {}

  async advance(examId: string, userId: string = 'system'): Promise<void> {
    const workflow = await this.workflowService.getWorkflow(examId);

    // Validate transition
    this.transitionGuard.canAdvance(workflow.currentStep, workflow.status);

    // Advance workflow state
    await this.workflowService.advanceStep(examId, userId);

    // Emit appropriate event based on NEW step
    const nextStep = await this.workflowService.getWorkflow(examId).then(w => w.currentStep);
    
    if (nextStep === WorkflowStep.QUESTION_REVIEW) {
      this.eventPublisher.emitGenerationCompleted(examId, 0); // we can update the count logic later
    } else if (nextStep === WorkflowStep.ASSEMBLY) {
      this.eventPublisher.emitReviewCompleted(examId);
    } else if (nextStep === WorkflowStep.PUBLISHING) {
      this.eventPublisher.emitAssemblyCompleted(examId);
    }
  }

  async rollback(examId: string, userId: string = 'system', reason?: string): Promise<void> {
    const workflow = await this.workflowService.getWorkflow(examId);

    // Validate rollback
    this.transitionGuard.canRollback(workflow.currentStep, workflow.status);

    await this.workflowService.rollback(examId, userId, reason);
  }

  async startGeneration(examId: string, userId: string = 'system'): Promise<void> {
    const workflow = await this.workflowService.getWorkflow(examId);

    if (workflow.currentStep !== WorkflowStep.CONFIGURATION) {
      // Advance to Generation step
      // Ensure we are in a valid state to do so, or just enforce order
    }

    this.eventPublisher.emitGenerationStarted(examId);

    try {
      // Synchronous generation call as per architectural decision
      await this.generationOrchestrator.generateQuestions(examId);
      
      // Auto-advance workflow when complete
      await this.advance(examId, userId);
      
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Generation failed for exam ${examId}: ${reason}`);
      await this.workflowService.fail(examId, reason, userId);
      this.eventPublisher.emitWorkflowFailed(examId, reason);
    }
  }

  async startAssembly(examId: string, userId: string = 'system'): Promise<void> {
    const workflow = await this.workflowService.getWorkflow(examId);

    if (workflow.currentStep !== WorkflowStep.QUESTION_REVIEW) {
      // Logic to advance or validate state
    }

    try {
      await this.assemblyService.assembleTest(examId, userId);
      await this.advance(examId, userId);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Assembly failed for exam ${examId}: ${reason}`);
      await this.workflowService.fail(examId, reason, userId);
      this.eventPublisher.emitWorkflowFailed(examId, reason);
    }
  }

  async publish(examId: string, userId: string = 'system'): Promise<void> {
    const workflow = await this.workflowService.getWorkflow(examId);
    this.transitionGuard.canPublish(workflow.currentStep, workflow.status);

    // Usually calls AssemblyPublisherService.publishAssembly(examId, userId)
    // Here we just mark workflow as complete
    await this.workflowService.complete(examId, userId);
    this.eventPublisher.emitPublishingCompleted(examId);
    this.eventPublisher.emitWorkflowCompleted(examId);
  }
}
