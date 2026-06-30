import { Injectable, NotFoundException } from '@nestjs/common';
import { WorkflowStep, WorkflowStatus, ExamWorkflow } from '@prisma/client';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { WorkflowTransactionService } from './workflow-transaction.service';
import { WorkflowStateMachine } from '../state-machine/workflow-state-machine';

@Injectable()
export class ExamWorkflowService {
  constructor(
    private readonly repository: WorkflowRepository,
    private readonly transactionService: WorkflowTransactionService,
  ) {}

  async createWorkflow(examId: string, userId: string = 'system'): Promise<ExamWorkflow> {
    return this.repository.create({
      examConfig: { connect: { id: examId } },
      currentStep: WorkflowStep.CONFIGURATION,
      status: WorkflowStatus.NOT_STARTED,
      completionPercentage: WorkflowStateMachine.getCompletionPercentage(WorkflowStep.CONFIGURATION),
      version: 0,
      history: {
        create: {
          currentStep: WorkflowStep.CONFIGURATION,
          changedBy: userId,
          triggerSource: 'manual',
          reason: 'Workflow initialized',
        },
      },
    });
  }

  async getWorkflow(examId: string): Promise<ExamWorkflow> {
    const workflow = await this.repository.findByExamId(examId);
    if (!workflow) {
      throw new NotFoundException(`Workflow for examId ${examId} not found`);
    }
    return workflow;
  }

  async advanceStep(examId: string, userId: string = 'system'): Promise<ExamWorkflow> {
    const workflow = await this.getWorkflow(examId);
    const nextStep = WorkflowStateMachine.getNextStep(workflow.currentStep);
    
    // Status is IN_PROGRESS when advancing, unless we reach the end
    const newStatus = WorkflowStatus.IN_PROGRESS;
    const newPercentage = WorkflowStateMachine.getCompletionPercentage(nextStep);

    return this.transactionService.executeTransition({
      workflowId: workflow.id,
      expectedVersion: workflow.version,
      newStep: nextStep,
      newStatus,
      newPercentage,
      historyEntry: {
        previousStep: workflow.currentStep,
        currentStep: nextStep,
        changedBy: userId,
        triggerSource: 'system',
        reason: 'Advanced to next step',
      },
    });
  }

  async rollback(examId: string, userId: string = 'system', reason?: string): Promise<ExamWorkflow> {
    const workflow = await this.getWorkflow(examId);
    const previousStep = WorkflowStateMachine.getPreviousStep(workflow.currentStep);
    const newPercentage = WorkflowStateMachine.getCompletionPercentage(previousStep);

    return this.transactionService.executeTransition({
      workflowId: workflow.id,
      expectedVersion: workflow.version,
      newStep: previousStep,
      newStatus: WorkflowStatus.IN_PROGRESS,
      newPercentage,
      historyEntry: {
        previousStep: workflow.currentStep,
        currentStep: previousStep,
        changedBy: userId,
        triggerSource: 'manual',
        reason: reason || 'Rolled back to previous step',
      },
    });
  }

  async complete(examId: string, userId: string = 'system'): Promise<ExamWorkflow> {
    const workflow = await this.getWorkflow(examId);
    const newPercentage = WorkflowStateMachine.getCompletionPercentage(WorkflowStep.COMPLETED);

    return this.transactionService.executeTransition({
      workflowId: workflow.id,
      expectedVersion: workflow.version,
      newStep: WorkflowStep.COMPLETED,
      newStatus: WorkflowStatus.COMPLETED,
      newPercentage,
      historyEntry: {
        previousStep: workflow.currentStep,
        currentStep: WorkflowStep.COMPLETED,
        changedBy: userId,
        triggerSource: 'system',
        reason: 'Workflow completed successfully',
      },
    });
  }

  async fail(examId: string, reason: string, userId: string = 'system'): Promise<ExamWorkflow> {
    const workflow = await this.getWorkflow(examId);

    return this.transactionService.executeFailure({
      workflowId: workflow.id,
      expectedVersion: workflow.version,
      reason,
      historyEntry: {
        previousStep: workflow.currentStep,
        currentStep: workflow.currentStep,
        changedBy: userId,
        triggerSource: 'system',
        reason: `Workflow failed: ${reason}`,
      },
    });
  }

  async retry(examId: string, step: WorkflowStep, userId: string = 'system'): Promise<ExamWorkflow> {
    const workflow = await this.getWorkflow(examId);

    return this.transactionService.executeRetry(
      workflow.id,
      workflow.version,
      step,
      {
        previousStep: workflow.currentStep,
        currentStep: step,
        changedBy: userId,
        triggerSource: 'retry',
        reason: `Retrying step ${step}`,
      },
    );
  }
}
