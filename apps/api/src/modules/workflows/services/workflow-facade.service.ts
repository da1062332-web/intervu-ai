import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { RedisCacheService } from '../../../cache/redis-cache.service';
import { WorkflowStep, WorkflowStatus } from '@prisma/client';
import { ExamWorkflowService } from './exam-workflow.service';
import { WorkflowStatusService } from './workflow-status.service';
import { WorkflowNextActionService } from './workflow-next-action.service';
import { ExamWorkflowOrchestrator } from '../orchestrators/exam-workflow.orchestrator';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { WorkflowFilterDto } from '../dto/workflow-filter.dto';
import {
  toWorkflowDashboardDto,
  toWorkflowResponseDto,
  toWorkflowStatusDto,
} from '../dto/workflow-mapper';
import { AssemblyPublisherService } from '../../assembly/services/assembly-publisher.service';

@Injectable()
export class WorkflowFacadeService {
  constructor(
    private readonly cache: RedisCacheService,
    private readonly workflowService: ExamWorkflowService,
    private readonly statusService: WorkflowStatusService,
    private readonly nextActionService: WorkflowNextActionService,
    private readonly orchestrator: ExamWorkflowOrchestrator,
    private readonly repository: WorkflowRepository,
    private readonly assemblyPublisher: AssemblyPublisherService,
  ) {}

  private async withIdempotency<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
    const isLocked = await this.cache.exists(key);
    if (isLocked) {
      throw new ConflictException('Operation already in progress');
    }
    await this.cache.set(key, '1', { ttl: ttlSeconds });
    try {
      return await fn();
    } finally {
      await this.cache.delete(key);
    }
  }

  private invalidateCache(examId: string) {
    this.cache.delete(`workflow:status:${examId}`);
    // Ideally we'd pattern match and delete `workflow:dashboard:*` here
  }

  async startWorkflow(examId: string, userId: string = 'system') {
    return this.withIdempotency(`workflow:lock:start:${examId}`, 30, async () => {
      const existing = await this.repository.findByExamId(examId);
      if (existing) throw new ConflictException('Workflow already exists for this exam');
      
      const workflow = await this.workflowService.createWorkflow(examId, userId);
      this.invalidateCache(examId);
      return toWorkflowResponseDto(workflow);
    });
  }

  async advanceWorkflow(examId: string, userId: string = 'system') {
    return this.withIdempotency(`workflow:lock:advance:${examId}`, 30, async () => {
      const precheck = await this.workflowService.getWorkflow(examId);
      // Silently return if workflow is already in a terminal state
      if (precheck.status === WorkflowStatus.COMPLETED || precheck.status === WorkflowStatus.FAILED) {
        return toWorkflowResponseDto(precheck);
      }
      await this.orchestrator.advance(examId, userId);
      this.invalidateCache(examId);
      const workflow = await this.workflowService.getWorkflow(examId);
      return toWorkflowResponseDto(workflow);
    });
  }

  async rollbackWorkflow(examId: string, reason?: string, userId: string = 'system') {
    return this.withIdempotency(`workflow:lock:rollback:${examId}`, 30, async () => {
      await this.orchestrator.rollback(examId, userId, reason);
      this.invalidateCache(examId);
      const workflow = await this.workflowService.getWorkflow(examId);
      return toWorkflowResponseDto(workflow);
    });
  }

  async startGeneration(examId: string, userId: string = 'system') {
    return this.withIdempotency(`workflow:lock:generation:${examId}`, 300, async () => {
      // Advance to generation step if needed
      await this.orchestrator.startGeneration(examId, userId);
      this.invalidateCache(examId);
      return { success: true, message: 'Generation started' };
    });
  }

  async startAssembly(examId: string, userId: string = 'system') {
    return this.withIdempotency(`workflow:lock:assembly:${examId}`, 300, async () => {
      await this.orchestrator.startAssembly(examId, userId);
      this.invalidateCache(examId);
      return { success: true, message: 'Assembly started' };
    });
  }

  async publishWorkflow(examId: string, userId: string = 'system') {
    return this.withIdempotency(`workflow:lock:publish:${examId}`, 60, async () => {
      const workflow = await this.workflowService.getWorkflow(examId);

      // Already completed — nothing to do
      if (workflow.status === WorkflowStatus.COMPLETED) {
        return toWorkflowResponseDto(workflow);
      }

      // Find the assembled test ID. Assuming configId = examId
      const testInstance = await this.statusService['prisma'].assembledTest.findFirst({
        where: { configId: examId },
        orderBy: { createdAt: 'desc' },
      });
      
      if (testInstance && testInstance.status !== 'PUBLISHED') {
        // If there's an assembled test, publish it properly
        await this.assemblyPublisher.publishAssembly(testInstance.id, userId);
      }
      
      // Always advance the workflow to COMPLETED
      await this.orchestrator.publish(examId, userId);
      this.invalidateCache(examId);
      const updated = await this.workflowService.getWorkflow(examId);
      return toWorkflowResponseDto(updated);
    });
  }

  async retryWorkflow(examId: string, step: WorkflowStep, userId: string = 'system') {
    return this.withIdempotency(`workflow:lock:retry:${examId}`, 30, async () => {
      const workflow = await this.workflowService.getWorkflow(examId);
      if (workflow.status !== WorkflowStatus.FAILED) {
        throw new ConflictException('Workflow is not in a FAILED status');
      }
      await this.workflowService.retry(examId, step, userId);
      this.invalidateCache(examId);
      const updated = await this.workflowService.getWorkflow(examId);
      return toWorkflowResponseDto(updated);
    });
  }

  async getDashboard(filter: WorkflowFilterDto) {
    const cacheKey = `workflow:dashboard:${JSON.stringify(filter)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    const result = await this.repository.findFiltered(filter);
    
    // Compute pending actions
    const items = await Promise.all(result.items.map(async (workflow) => {
      const statusData = await this.statusService.aggregateStatus(workflow);
      const nextAction = this.nextActionService.getNextAction({
        ...statusData,
        currentStep: workflow.currentStep,
        status: workflow.status,
        completionPercentage: workflow.completionPercentage,
      });
      return toWorkflowDashboardDto(workflow, nextAction);
    }));

    const response = { items, total: result.total };
    await this.cache.set(cacheKey, JSON.stringify(response), { ttl: 60 });
    return response;
  }

  async getWorkflowStatus(examId: string) {
    const cacheKey = `workflow:status:${examId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    const workflow = await this.workflowService.getWorkflow(examId);
    const statusData = await this.statusService.aggregateStatus(workflow);
    const nextAction = this.nextActionService.getNextAction({
      ...statusData,
      currentStep: workflow.currentStep,
      status: workflow.status,
      completionPercentage: workflow.completionPercentage,
    });

    // Fetch history records
    const history = await this.repository['prisma'].examWorkflowHistory.findMany({
      where: { workflowId: workflow.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const response = {
      ...toWorkflowStatusDto(statusData, workflow, nextAction),
      history: history.map((h: any) => ({
        id: h.id,
        step: h.currentStep,
        changedBy: h.changedBy || 'system',
        date: h.createdAt,
        reason: h.reason,
        source: h.triggerSource || 'system',
        ipAddress: h.ipAddress || 'N/A',
      })),
    };
    await this.cache.set(cacheKey, JSON.stringify(response), { ttl: 30 });
    return response;
  }

  async getAdminInsights() {
    return {
      totalExams: await this.repository['prisma'].examConfig.count(),
      generatedQuestions: await this.repository['prisma'].question.count(),
      pendingReviews: await this.repository['prisma'].question.count({ where: { status: 'DRAFT' } }),
      publishedTests: await this.repository['prisma'].assembledTest.count({ where: { status: 'PUBLISHED' } }),
      failedAssemblies: 0, // Mock
      recentlyCompletedCount: await this.repository['prisma'].examWorkflow.count({ where: { status: 'COMPLETED' } }),
      averageGenerationTimeMs: 1500,
      averageReviewTimeMs: 2500,
      averageAssemblyTimeMs: 3000,
      averagePublishTimeMs: 500,
      workflowFailureRate: 2,
      recentlyCompletedWorkflows: [],
    };
  }

  async getWorkflowOverview(examId: string) {
    const prisma = this.repository['prisma'];

    const [config, workflow, questions, assembly] = await Promise.all([
      prisma.examConfig.findUnique({
        where: { id: examId },
        include: {
          sections: { include: { sectionTopics: { include: { topic: true } } } },
          difficultyDistribution: true,
          ruleFlags: true,
        },
      }),
      prisma.examWorkflow.findFirst({ where: { examId } }),
      prisma.question.findMany({
        where: { section: { examConfigId: examId } },
        include: { topic: true },
      }),
      prisma.assembledTest.findFirst({
        where: { configId: examId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const questionStats = {
      total: questions.length,
      // DRAFT = pending review, VALIDATED = approved, ARCHIVED = rejected, ACTIVE = in use
      draft: questions.filter(q => q.status === 'DRAFT').length,
      approved: questions.filter(q => q.status === 'VALIDATED' || q.status === 'ACTIVE').length,
      rejected: questions.filter(q => q.status === 'ARCHIVED').length,
    };

    return {
      examName: config?.name ?? 'Unknown',
      examRole: config?.role ?? '',
      totalQuestions: config?.totalQuestions ?? 0,
      durationMinutes: config?.durationMinutes ?? 0,
      sections: config?.sections?.map(s => ({
        id: s.id,
        name: s.name,
        questionCount: s.questionCount,
        topics: s.sectionTopics?.map(st => st.topic?.name ?? '') ?? [],
      })) ?? [],
      questionStats,
      workflowStatus: workflow?.status ?? 'NOT_STARTED',
      currentStep: workflow?.currentStep ?? 'CONFIGURATION',
      completionPercentage: workflow?.completionPercentage ?? 0,
      assembledAt: assembly?.createdAt ?? null,
      publishedAt: assembly?.status === 'PUBLISHED' ? assembly.updatedAt : null,
      difficultyDistribution: config?.difficultyDistribution ?? null,
    };
  }

  async getWorkflowQuestions(examId: string, page = 1, limit = 50, status?: string) {
    const prisma = this.repository['prisma'];
    const skip = (page - 1) * limit;

    const where: any = { section: { examConfigId: examId } };
    if (status) where.status = status;

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: { topic: true, section: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.question.count({ where }),
    ]);

    return {
      items: questions.map((q: any) => ({
        id: q.id,
        questionText: q.questionText,
        answer: q.answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        // Map internal statuses to UI-friendly labels
        status: q.status === 'VALIDATED' || q.status === 'ACTIVE' ? 'APPROVED' :
                q.status === 'ARCHIVED' ? 'REJECTED' : q.status,
        internalStatus: q.status,
        topic: q.topic?.name ?? 'Unknown',
        topicId: q.topicId,
        section: q.section?.name ?? 'Unknown',
        sectionId: q.sectionId,
        source: q.source,
        createdAt: q.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  async approveQuestion(questionId: string, userId: string) {
    const prisma = this.repository['prisma'];
    // VALIDATED = approved in the QuestionStatus enum
    await prisma.question.update({ where: { id: questionId }, data: { status: 'VALIDATED' } });
    await prisma.questionReview.create({
      data: { questionId, status: 'APPROVED', notes: `Approved by ${userId}` },
    });
    return { success: true };
  }

  async rejectQuestion(questionId: string, userId: string, reason?: string) {
    const prisma = this.repository['prisma'];
    // ARCHIVED = rejected/hidden in the QuestionStatus enum
    await prisma.question.update({ where: { id: questionId }, data: { status: 'ARCHIVED' } });
    await prisma.questionReview.create({
      data: { questionId, status: 'REJECTED', notes: reason ?? `Rejected by ${userId}` },
    });
    return { success: true };
  }

  async bulkApproveQuestions(questionIds: string[], userId: string) {
    const prisma = this.repository['prisma'];
    await prisma.question.updateMany({
      where: { id: { in: questionIds } },
      data: { status: 'VALIDATED' },
    });
    return { success: true, count: questionIds.length };
  }

  // Stubs for Bulk Operations
  async bulkPublish(examIds: string[], userId: string = 'system') {
    return { succeeded: [], failed: [], total: 0 };
  }
  async bulkArchive(examIds: string[], userId: string = 'system') {
    return { succeeded: [], failed: [], total: 0 };
  }
  async bulkRetry(examIds: string[], step: WorkflowStep, userId: string = 'system') {
    return { succeeded: [], failed: [], total: 0 };
  }
}

