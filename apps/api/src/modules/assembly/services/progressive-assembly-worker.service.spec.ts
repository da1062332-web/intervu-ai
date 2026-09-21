import { Test, TestingModule } from "@nestjs/testing";
import { ProgressiveAssemblyWorkerService } from "./progressive-assembly-worker.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { QuestionAllocatorService } from "./question-allocator.service";
import { SectionBuilderService } from "./section-builder.service";
import { QuestionPoolRepository } from "../repositories/question-pool.repository";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { FinalShufflerService } from "../../tests/start-test/final-shuffler.service";

describe("ProgressiveAssemblyWorkerService", () => {
  let service: ProgressiveAssemblyWorkerService;
  let prisma: any;
  let allocator: any;
  let sectionBuilder: any;

  beforeEach(async () => {
    prisma = {
      question: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      assembledTestSection: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: "asm-sec-1" }),
      },
      assembledTestQuestion: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      testInstanceSection: {
        findFirst: jest.fn().mockResolvedValue({
          id: "existing-section-cuid",
          testInstanceId: "test-inst-1",
          sectionKey: "sec_2",
          orderIndex: 1,
        }),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({ id: "new-section-cuid" }),
        count: jest.fn().mockResolvedValue(1),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      testInstanceQuestion: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      ruleFlags: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    allocator = {
      allocateQuestions: jest.fn().mockResolvedValue([
        {
          questionId: "q-101",
          questionOrder: 0,
          questionSnapshot: { title: "Problem 1" },
        },
      ]),
    };

    sectionBuilder = {
      buildSection: jest.fn().mockReturnValue({
        sectionKey: "sec_2",
        displayName: "Coding Section",
        durationSeconds: 1800,
        questionCount: 1,
        orderIndex: 1,
        questions: [
          {
            questionId: "q-101",
            questionOrder: 0,
            questionSnapshot: { title: "Problem 1" },
          },
        ],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressiveAssemblyWorkerService,
        { provide: PrismaService, useValue: prisma },
        { provide: QuestionAllocatorService, useValue: allocator },
        { provide: SectionBuilderService, useValue: sectionBuilder },
        { provide: QuestionPoolRepository, useValue: { seedQuestions: jest.fn() } },
        { provide: RedisCacheService, useValue: { delete: jest.fn().mockResolvedValue(undefined) } },
        { provide: FinalShufflerService, useValue: null },
      ],
    }).compile();

    service = module.get<ProgressiveAssemblyWorkerService>(ProgressiveAssemblyWorkerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should populate remaining sections reusing existing TestInstanceSection and its CUID ID", async () => {
    const blueprintSections = [
      {
        sectionKey: "sec_2",
        displayName: "Coding Section",
        durationSeconds: 1800,
        questionCount: 1,
        orderIndex: 1,
        topicAllocations: [],
      } as any,
    ];

    await service.populateRemainingSections(
      "test-inst-1",
      "cfg-1",
      "user-1",
      blueprintSections,
      new Set(),
      [],
    );

    // 1. Must check for existing testInstanceSection
    expect(prisma.testInstanceSection.findFirst).toHaveBeenCalledWith({
      where: {
        testInstanceId: "test-inst-1",
        sectionKey: "sec_2",
      },
    });

    // 2. Must update existing section rather than creating an orderIndex collision
    expect(prisma.testInstanceSection.update).toHaveBeenCalledWith({
      where: { id: "existing-section-cuid" },
      data: {
        questionCount: 1,
        durationSeconds: 1800,
      },
    });

    // 3. Must attach questions to existing-section-cuid
    expect(prisma.testInstanceQuestion.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          testInstanceId: "test-inst-1",
          sectionId: "existing-section-cuid",
          questionId: "q-101",
        }),
      ],
      skipDuplicates: true,
    });
  });
});
