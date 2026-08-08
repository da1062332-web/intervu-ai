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

describe("Single-Question Exam: Candidate Re-Exam & AI Runtime Generation E2E Flow", () => {
  let assemblyService: AssemblyService;
  let mockPrisma: any;
  let mockOrchestrator: any;
  let mockQuestionPoolRepo: any;
  let mockAssembledTestRepo: any;
  let mockBlueprintBuilder: any;
  let mockPersistenceService: any;

  const mockConfigId = "cfg-single-question-exam";
  const mockUserId = "candidate-user-1";

  beforeEach(async () => {
    // 1. In-memory DB state for RuleFlags & Attempts
    const ruleFlagsDb: Record<string, any> = {
      [mockConfigId]: {
        id: "rf-single-1",
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
        findUnique: jest.fn().mockImplementation(({ where }: { where: { examConfigId: string } }) => {
          return Promise.resolve(ruleFlagsDb[where.examConfigId] || null);
        }),
        upsert: jest.fn().mockImplementation(({ where, update, create }: any) => {
          const existing = ruleFlagsDb[where.examConfigId] || {};
          const updated = { ...existing, ...update, ...create, examConfigId: where.examConfigId };
          ruleFlagsDb[where.examConfigId] = updated;
          return Promise.resolve(updated);
        }),
      },
      examConfig: {
        count: jest.fn().mockResolvedValue(1),
      },
      testInstance: {
        findMany: jest.fn().mockImplementation(({ where }: { where: { userId: string } }) => {
          return Promise.resolve(
            testInstancesDb.filter((ti) => ti.userId === where.userId),
          );
        }),
      },
      generatedQuestion: {
        create: jest.fn().mockImplementation(({ data }: { data: any }) => {
          const record = { id: `gen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, ...data };
          generatedQuestionsDb.push(record);
          return Promise.resolve(record);
        }),
      },
    };

    // 2. Mock AI Generator Engine (GenerationOrchestratorService)
    mockOrchestrator = {
      generateQuestions: jest.fn().mockImplementation(async (params: { topic: string; difficulty: string }) => {
        return {
          questions: [
            {
              questionText: `What is the memory structure in ${params.topic}?`,
              options: ["Heap and Stack", "DOM Tree", "Registers only", "Kernel Space"],
              correctAnswer: "Heap and Stack",
              solution: "Java memory is divided into Heap memory and Stack memory.",
            },
          ],
          failures: [],
        };
      }),
    };

    // 3. Question Bank Pool Mock (Starts with ONLY 1 Question)
    const initialBank = [
      {
        id: "q_pool_java_1",
        questionHash: "hash_java_1",
        conceptKey: "TOPIC_JAVA",
        difficultyLevel: "MEDIUM",
        questionType: "MULTIPLE_CHOICE",
        questionText: "What is an Interface in Java?",
        options: ["Abstract contract", "Concrete class", "Database table", "Variable"],
        correctAnswer: "Abstract contract",
        solution: "Interfaces define abstract method signatures in Java.",
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
      fetchQuestions: jest.fn().mockImplementation(async (filters: { excludeIds?: string[] }) => {
        const exclude = new Set(filters.excludeIds || []);
        return initialBank.filter((q) => !exclude.has(q.id));
      }),
    };

    // 4. Mock AssembledTest Repository (Returns cached assembly if candidateNoRepeatEnabled is false)
    mockAssembledTestRepo = {
      findLatestReusableByConfigId: jest.fn().mockImplementation(async (configId: string) => {
        return {
          id: "assembly_cached_single_100",
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

    // 5. Mock Blueprint Builder (Exam has 1 Section with exactly 1 Question requirement)
    mockBlueprintBuilder = {
      generateBlueprint: jest.fn().mockResolvedValue({
        sections: [
          {
            sectionKey: "sec_java_core",
            displayName: "Core Java Section",
            durationSeconds: 300,
            questionCount: 1, // Exactly 1 Question for the entire exam
            orderIndex: 0,
            topicAllocations: [{ topicId: "TOPIC_JAVA", percentage: 100 }],
            difficultyDistribution: { EASY: 0, MEDIUM: 100, HARD: 0 },
          } as BlueprintSectionDto,
        ],
      }),
    };

    // 6. Mock Assembly Persistence Service
    mockPersistenceService = {
      saveAssembly: jest.fn().mockImplementation(async (configId: string, sections: any[], userId: string) => {
        const instanceId = `inst_single_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const questionsList: any[] = [];
        for (const s of sections) {
          for (const q of s.questions) {
            questionsList.push({ questionId: q.questionId, snapshot: q.questionSnapshot });
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
        {
          provide: QuestionAllocatorService,
          useFactory: () =>
            new QuestionAllocatorService(
              mockQuestionPoolRepo,
              { filterPool: (p: any) => p } as any,
              mockPrisma,
              mockOrchestrator,
            ),
        },
        { provide: QuestionPoolRepository, useValue: mockQuestionPoolRepo },
        { provide: AssembledTestRepository, useValue: mockAssembledTestRepo },
        { provide: BlueprintBuilderService, useValue: mockBlueprintBuilder },
        { provide: AssemblyPersistenceService, useValue: mockPersistenceService },
        {
          provide: "RuleFlagsRepository",
          useValue: {
            checkConfigExists: () => true,
            findByConfigId: (id: string) => ruleFlagsDb[id],
            upsert: (id: string, d: any) => (ruleFlagsDb[id] = { ...ruleFlagsDb[id], ...d }),
          },
        },
      ],
    }).compile();

    assemblyService = moduleRef.get<AssemblyService>(AssemblyService);
  });

  it("Step 1: Attempt #1 — Candidate starts 1-question exam and gets Question 1 from Bank", async () => {
    const testInstanceId1 = await assemblyService.assembleTest(mockConfigId, mockUserId);
    expect(testInstanceId1).toBeDefined();

    // Verify Candidate History records Attempt #1 question
    const seenQuestionsAttempt1 = await mockQuestionPoolRepo.findRecentUsedQuestions(mockUserId);
    expect(seenQuestionsAttempt1).toHaveLength(1);
    expect(seenQuestionsAttempt1[0]).toBe("q_pool_java_1");
  });

  it("Step 2: Attempt #2 — Candidate retakes 1-question exam, history excludes Question 1, pool has 0 unseen questions, AI Engine generates Question 2 on-the-fly", async () => {
    // Complete Attempt #1 first
    await assemblyService.assembleTest(mockConfigId, mockUserId);
    const seenAttempt1 = await mockQuestionPoolRepo.findRecentUsedQuestions(mockUserId);
    expect(seenAttempt1).toEqual(["q_pool_java_1"]);

    // Candidate retakes the exam (Attempt #2)
    const testInstanceId2 = await assemblyService.assembleTest(mockConfigId, mockUserId);

    // Verify 1: Bypassed cached assembly
    expect(testInstanceId2).not.toBe("assembly_cached_single_100");

    // Verify 2: AI Engine was triggered for 1 missing question
    expect(mockOrchestrator.generateQuestions).toHaveBeenCalledWith({
      topic: "TOPIC_JAVA",
      count: 1,
      difficulty: "MEDIUM",
    });

    // Verify 3: Generated question was persisted to database
    expect(mockPrisma.generatedQuestion.create).toHaveBeenCalled();
    const dbCallArg = mockPrisma.generatedQuestion.create.mock.calls[0][0].data;

    // Check validity of AI-generated question structure
    expect(dbCallArg.conceptKey).toBe("TOPIC_JAVA");
    expect(dbCallArg.difficultyLevel).toBe("MEDIUM");
    expect(dbCallArg.questionText).toBe("What is the memory structure in TOPIC_JAVA?");
    expect(dbCallArg.options).toEqual(["Heap and Stack", "DOM Tree", "Registers only", "Kernel Space"]);
    expect(dbCallArg.correctAnswer).toBe("Heap and Stack");
    expect(dbCallArg.solution).toContain("Heap memory and Stack memory");
    expect(dbCallArg.metadata.source).toBe("RUNTIME_AI_GENERATED");

    // Verify 4: Attempt #1 question (q_pool_java_1) and Attempt #2 question (gen_...) have ZERO overlap
    const totalSeenQuestions = await mockQuestionPoolRepo.findRecentUsedQuestions(mockUserId);
    expect(totalSeenQuestions).toHaveLength(2);
    expect(totalSeenQuestions[0]).toBe("q_pool_java_1");
    expect(totalSeenQuestions[1]).toMatch(/^gen_/);
  });

  it("Step 3: If candidateNoRepeatEnabled is FALSE, system reuses cached assembly and serves same question", async () => {
    // Disable candidateNoRepeatEnabled flag
    await mockPrisma.ruleFlags.upsert({
      where: { examConfigId: mockConfigId },
      update: { candidateNoRepeatEnabled: false },
      create: { candidateNoRepeatEnabled: false },
    });

    const testInstanceId = await assemblyService.assembleTest(mockConfigId, mockUserId);
    expect(testInstanceId).toBe("assembly_cached_single_100"); // Returned cached assembly
  });
});
