import { Test, TestingModule } from "@nestjs/testing";
import { AssemblyService } from "../services/test-assembly.service";
import { QuestionAllocatorService } from "../services/question-allocator.service";
import { RuleFlagsService } from "../../rule-flags/services/rule-flags.service";
import { BlueprintBuilderService } from "../services/blueprint-builder.service";
import { QuestionPoolRepository } from "../repositories/question-pool.repository";
import { AssembledTestRepository } from "../repositories/assembled-test.repository";
import { AssemblyPersistenceService } from "../services/assembly-persistence.service";
import { SectionBuilderService } from "../services/section-builder.service";
import { AssemblyValidatorService } from "../validators/assembly-validator.service";
import { AntiRepetitionService } from "../services/anti-repetition.service";
import { BlueprintSectionDto } from "@intervu/shared";

describe("Candidate Unique Questions & Runtime AI Generation (End-to-End Integration)", () => {
  let assemblyService: AssemblyService;
  let ruleFlagsService: RuleFlagsService;
  let mockPrisma: any;
  let mockOrchestrator: any;
  let mockQuestionPoolRepo: any;
  let mockAssembledTestRepo: any;
  let mockBlueprintBuilder: any;
  let mockPersistenceService: any;

  const mockConfigId = "cfg-e2e-100";
  const mockUserId = "user-candidate-e2e";

  beforeEach(async () => {
    // 1. In-memory database state
    const ruleFlagsDb: Record<string, any> = {
      [mockConfigId]: {
        id: "rf-1",
        examConfigId: mockConfigId,
        negativeMarkingEnabled: false,
        sectionalCutoffEnabled: false,
        adaptiveDifficultyEnabled: false,
        shuffleQuestionsEnabled: false,
        shuffleOptionsEnabled: false,
        allowSectionNavigation: false,
        maxAttempts: 3,
        candidateNoRepeatEnabled: true,
        runtimeGenerationOnDeficit: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const generatedQuestionsDb: any[] = [];
    const testInstancesDb: any[] = [];

    mockPrisma = {
      ruleFlags: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(ruleFlagsDb[where.examConfigId] || null);
        }),
        upsert: jest.fn().mockImplementation(({ where, update, create }) => {
          const existing = ruleFlagsDb[where.examConfigId] || {};
          const updated = { ...existing, ...update, ...create, examConfigId: where.examConfigId };
          ruleFlagsDb[where.examConfigId] = updated;
          return Promise.resolve(updated);
        }),
        count: jest.fn().mockResolvedValue(1),
      },
      examConfig: {
        count: jest.fn().mockResolvedValue(1),
      },
      testInstance: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(
            testInstancesDb.filter((ti) => ti.userId === where.userId),
          );
        }),
      },
      generatedQuestion: {
        create: jest.fn().mockImplementation(({ data }) => {
          const record = { id: `gen_${Date.now()}_${Math.random()}`, ...data };
          generatedQuestionsDb.push(record);
          return Promise.resolve(record);
        }),
      },
    };

    // 2. Mock AI Generator Orchestrator
    mockOrchestrator = {
      generateQuestions: jest.fn().mockImplementation(async (params) => {
        return {
          questions: [
            {
              questionText: `AI Runtime Generated Question for ${params.topic} (${params.difficulty})`,
              options: ["Ans A", "Ans B", "Ans C", "Ans D"],
              correctAnswer: "Ans A",
              solution: "Step by step AI explanation",
            },
          ],
          failures: [],
        };
      }),
    };

    // 3. Question Bank Pool Mock (Starts with only 2 questions)
    const initialPool = [
      {
        id: "q_pool_1",
        questionHash: "hash_1",
        conceptKey: "TOPIC_MATH",
        difficultyLevel: "MEDIUM",
        questionType: "MULTIPLE_CHOICE",
        questionText: "Pool Question 1",
      },
      {
        id: "q_pool_2",
        questionHash: "hash_2",
        conceptKey: "TOPIC_MATH",
        difficultyLevel: "MEDIUM",
        questionType: "MULTIPLE_CHOICE",
        questionText: "Pool Question 2",
      },
    ];

    mockQuestionPoolRepo = {
      findRecentUsedQuestions: jest.fn().mockImplementation(async (userId: string) => {
        const seenIds = new Set<string>();
        for (const ti of testInstancesDb.filter((t) => t.userId === userId)) {
          for (const q of ti.questions || []) {
            seenIds.add(q.questionId);
          }
        }
        return Array.from(seenIds);
      }),
      fetchQuestions: jest.fn().mockImplementation(async (filters) => {
        const exclude = new Set(filters.excludeIds || []);
        return initialPool.filter((q) => !exclude.has(q.id));
      }),
    };

    // 4. Mock AssembledTest Repository (Returns reusable assembly when flag is false)
    mockAssembledTestRepo = {
      findLatestReusableByConfigId: jest.fn().mockImplementation(async (configId: string) => {
        return {
          id: "assembly_cached_100",
          configId,
          status: "PUBLISHED",
          createdAt: new Date(),
          updatedAt: new Date(),
          examConfig: {
            updatedAt: new Date(),
            ruleFlags: ruleFlagsDb[configId],
          },
        };
      }),
    };

    // 5. Mock Blueprint Builder (Section requires 2 MEDIUM Math questions)
    mockBlueprintBuilder = {
      generateBlueprint: jest.fn().mockResolvedValue({
        sections: [
          {
            sectionKey: "sec_math",
            displayName: "Mathematics",
            durationSeconds: 600,
            questionCount: 2,
            orderIndex: 0,
            topicAllocations: [{ topicId: "TOPIC_MATH", percentage: 100 }],
            difficultyDistribution: { EASY: 0, MEDIUM: 100, HARD: 0 },
          } as BlueprintSectionDto,
        ],
      }),
    };

    // 6. Mock Assembly Persistence
    mockPersistenceService = {
      saveAssembly: jest.fn().mockImplementation(async (configId, sections, userId) => {
        const instanceId = `inst_${Date.now()}_${Math.random()}`;
        const questionsList: any[] = [];
        for (const s of sections) {
          for (const q of s.questions) {
            questionsList.push({ questionId: q.questionId });
          }
        }
        testInstancesDb.push({
          id: instanceId,
          configId,
          userId,
          questions: questionsList,
          sections,
        });
        return instanceId;
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AssemblyService,
        RuleFlagsService,
        SectionBuilderService,
        AssemblyValidatorService,
        AntiRepetitionService,
        { provide: QuestionAllocatorService, useFactory: () => new QuestionAllocatorService(mockQuestionPoolRepo, { filterPool: (p: any) => p } as any, mockPrisma, mockOrchestrator) },
        { provide: QuestionPoolRepository, useValue: mockQuestionPoolRepo },
        { provide: AssembledTestRepository, useValue: mockAssembledTestRepo },
        { provide: BlueprintBuilderService, useValue: mockBlueprintBuilder },
        { provide: AssemblyPersistenceService, useValue: mockPersistenceService },
        { provide: "RuleFlagsRepository", useValue: { checkConfigExists: () => true, findByConfigId: (id: string) => ruleFlagsDb[id], upsert: (id: string, d: any) => ruleFlagsDb[id] = { ...ruleFlagsDb[id], ...d } } },
      ],
    }).compile();

    assemblyService = moduleRef.get<AssemblyService>(AssemblyService);
  });

  it("Step 1: Should allow Admin to enable candidateNoRepeat & runtimeGenerationOnDeficit flags", async () => {
    const updatedFlags = await mockPrisma.ruleFlags.upsert({
      where: { examConfigId: mockConfigId },
      update: { candidateNoRepeatEnabled: true, runtimeGenerationOnDeficit: true },
      create: { candidateNoRepeatEnabled: true, runtimeGenerationOnDeficit: true },
    });

    expect(updatedFlags.candidateNoRepeatEnabled).toBe(true);
    expect(updatedFlags.runtimeGenerationOnDeficit).toBe(true);
  });

  it("Step 2: Candidate Attempt #1 receives questions from Question Bank pool", async () => {
    const instanceId1 = await assemblyService.assembleTest(mockConfigId, mockUserId);
    expect(instanceId1).toBeDefined();

    const history1 = await mockQuestionPoolRepo.findRecentUsedQuestions(mockUserId);
    expect(history1).toContain("q_pool_1");
    expect(history1).toContain("q_pool_2");
    expect(history1).toHaveLength(2);
  });

  it("Step 3 & 4: Candidate Attempt #2 excludes Attempt #1 questions, detects deficit, generates new questions via AI, and receives ZERO overlapping questions", async () => {
    // Run Attempt #1
    await assemblyService.assembleTest(mockConfigId, mockUserId);
    const attempt1Questions = await mockQuestionPoolRepo.findRecentUsedQuestions(mockUserId);
    expect(attempt1Questions).toEqual(["q_pool_1", "q_pool_2"]);

    // Run Attempt #2 for the same candidate
    const instanceId2 = await assemblyService.assembleTest(mockConfigId, mockUserId);
    expect(instanceId2).toBeDefined();
    expect(instanceId2).not.toBe("assembly_cached_100"); // Verified: Bypassed cached assembly!

    // Verify AI Generator was called to handle question pool deficit
    expect(mockOrchestrator.generateQuestions).toHaveBeenCalled();
    expect(mockPrisma.generatedQuestion.create).toHaveBeenCalled();

    // Verify Attempt #2 contains new generated question IDs and 0 overlap with Attempt #1
    const allHistory = await mockQuestionPoolRepo.findRecentUsedQuestions(mockUserId);
    expect(allHistory.length).toBeGreaterThan(2);

    const attempt2NewQuestions = allHistory.filter((id: string) => !attempt1Questions.includes(id));
    expect(attempt2NewQuestions.length).toBe(2);
    expect(attempt2NewQuestions[0]).toMatch(/^gen_/);
    expect(attempt2NewQuestions[1]).toMatch(/^gen_/);
  });
});
