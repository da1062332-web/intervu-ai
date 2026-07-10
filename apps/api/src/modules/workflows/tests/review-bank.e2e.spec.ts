import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { WorkflowFacadeService } from "../services/workflow-facade.service";
import { QuestionRepository } from "../../question-bank/repositories/question.repository";
import { QuestionVersionService } from "../../question-bank/services/question-version.service";
import { QuestionReviewService } from "../../question-bank/services/question-review.service";
import { QuestionReviewRepository } from "../../question-bank/repositories/question-review.repository";
import { QuestionVersionRepository } from "../../question-bank/repositories/question-version.repository";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { ExamWorkflowService } from "../services/exam-workflow.service";
import { WorkflowStatusService } from "../services/workflow-status.service";
import { WorkflowNextActionService } from "../services/workflow-next-action.service";
import { ExamWorkflowOrchestrator } from "../orchestrators/exam-workflow.orchestrator";
import { WorkflowRepository } from "../repositories/workflow.repository";
import { AssemblyPublisherService } from "../../assembly/services/assembly-publisher.service";
import { QuestionStatus } from "@prisma/client";

describe("Workflow E2E — Review Queue to Question Bank", () => {
  let facade: WorkflowFacadeService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      question: {
        findUnique: jest.fn().mockResolvedValue({
          id: "q-review-1",
          questionText: "What is TypeScript?",
          answer: "Superset of JS",
          explanation: "Adds static typing to JS",
          difficulty: "EASY",
          difficultyScore: 0.1,
          source: "GENERATED",
          templateId: "ts-basics",
          version: 1,
          status: "VALIDATED",
          metadata: {
            options: ["Superset of JS", "Subset of JS", "Framework", "Library"],
          },
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: "q-review-1",
            questionText: "What is TypeScript?",
            answer: "Superset of JS",
            explanation: "Adds static typing to JS",
            difficulty: "EASY",
            difficultyScore: 0.1,
            source: "GENERATED",
            templateId: "ts-basics",
            version: 1,
            status: "VALIDATED",
            metadata: {
              options: [
                "Superset of JS",
                "Subset of JS",
                "Framework",
                "Library",
              ],
            },
            versions: [],
          },
        ]),
        update: jest.fn().mockImplementation((args) => {
          return Promise.resolve({
            id: args.where.id,
            questionText: "What is TypeScript?",
            answer: "Superset of JS",
            explanation: "Adds static typing to JS",
            difficulty: "EASY",
            difficultyScore: 0.1,
            source: "GENERATED",
            templateId: "ts-basics",
            version: 2,
            status: args.data.status,
            metadata: {
              options: [
                "Superset of JS",
                "Subset of JS",
                "Framework",
                "Library",
              ],
            },
          });
        }),
      },
      questionVersion: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      questionReview: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowFacadeService,
        QuestionReviewService,
        QuestionRepository,
        QuestionVersionService,
        QuestionReviewRepository,
        QuestionVersionRepository,
        {
          provide: RedisCacheService,
          useValue: {
            exists: jest.fn().mockResolvedValue(false),
            set: jest.fn(),
          },
        },
        { provide: ExamWorkflowService, useValue: {} },
        { provide: WorkflowStatusService, useValue: {} },
        { provide: WorkflowNextActionService, useValue: {} },
        { provide: ExamWorkflowOrchestrator, useValue: {} },
        { provide: WorkflowRepository, useValue: { prisma: prismaMock } },
        { provide: AssemblyPublisherService, useValue: {} },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    facade = module.get<WorkflowFacadeService>(WorkflowFacadeService);
  });

  it("should approve a validated question, increment version, save version snapshot, and record review logs", async () => {
    const result = await facade.approveQuestion("q-review-1", "admin-001");

    expect(result.success).toBe(true);

    // Verify Question is set to VALIDATED
    expect(prismaMock.question.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "q-review-1" },
        data: expect.objectContaining({ status: "VALIDATED" }),
      }),
    );

    // Verify Version snapshot is saved
    expect(prismaMock.questionVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          questionId: "q-review-1",
          version: 2,
          snapshot: expect.objectContaining({
            status: "VALIDATED",
            options: expect.arrayContaining(["Superset of JS"]),
          }),
        }),
      }),
    );

    // Verify Review log is recorded
    expect(prismaMock.questionReview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          questionId: "q-review-1",
          status: "APPROVED",
          notes: "Approved by admin-001",
        }),
      }),
    );
  });

  it("should reject a validated question, change status to ARCHIVED, increment version, and record log", async () => {
    const result = await facade.rejectQuestion(
      "q-review-1",
      "admin-001",
      "Poor wording",
    );

    expect(result.success).toBe(true);

    // Verify Question status is set to ARCHIVED
    expect(prismaMock.question.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "q-review-1" },
        data: expect.objectContaining({ status: "ARCHIVED" }),
      }),
    );

    // Verify snapshot created
    expect(prismaMock.questionVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          questionId: "q-review-1",
          snapshot: expect.objectContaining({
            status: "ARCHIVED",
            options: expect.arrayContaining(["Superset of JS"]),
          }),
        }),
      }),
    );

    // Verify Review log contains reason
    expect(prismaMock.questionReview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "REJECTED",
          notes: "Poor wording",
        }),
      }),
    );
  });

  it("should support bulk approvals inside a transactional context", async () => {
    const result = await facade.bulkApproveQuestions(
      ["q-review-1"],
      "admin-001",
    );

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.question.update).toHaveBeenCalled();
    expect(prismaMock.questionVersion.create).toHaveBeenCalled();
    expect(prismaMock.questionReview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "APPROVED",
          notes: "Bulk approved by admin-001",
        }),
      }),
    );
  });
});
