import { Test, TestingModule } from "@nestjs/testing";
import { GenerationStrategy, DifficultyLevel, CodingPatternStatus } from "@prisma/client";

import { PrismaService } from "../../../prisma/prisma.service";
import { CodingPatternSelectorService } from "../../coding/services/coding-pattern-selector.service";
import { CodingStatementGeneratorService } from "../../coding/services/coding-statement-generator.service";
import { CodingPatternGenerationStrategy } from "../strategies/coding-pattern/coding-pattern-generation.strategy";
import { QuestionRepository } from "../repository/question.repository";
import { QuestionAssemblerService } from "../assembler/question-assembler.service";
import { PatternExecutionService } from "../../coding/services/pattern-execution.service";
import { OracleRegistry } from "../../coding/oracles/oracle.registry";
import { CodingOracleService } from "../../coding/services/coding-oracle.service";
import { CodingPatternRepository } from "../../coding/repositories/coding-pattern.repository";
import { CodingOracleRepository } from "../../coding/repositories/coding-oracle.repository";
import { ArrayRotationOracle } from "../../coding/oracles/array-rotation.oracle";
import { SeededParameterGeneratorService } from "../../coding/generators/seeded-parameter-generator.service";
import { TestSuiteGeneratorService } from "../../coding/generators/test-suite-generator.service";
import { PatternValidatorService } from "../../coding/validators/pattern-validator.service";
import { ParameterValidator } from "../../coding/validators/parameter-validator";
import { ConstraintValidator } from "../../coding/validators/constraint-validator";
import { OracleValidator } from "../../coding/validators/oracle-validator";
import { TestCaseValidator } from "../../coding/validators/test-case-validator";
import { DifficultyValidator } from "../../coding/validators/difficulty-validator";
import { ExecutionService } from "../../execution/services/execution.service";
import { TestInstanceRepository } from "../../execution/repositories/test-instance.repository";
import { ExecutionValidatorService } from "../../execution/services/execution-validator.service";
import { AssemblyPersistenceService } from "../../assembly/services/assembly-persistence.service";
import { AssembledTestRepository } from "../../assembly/repositories/assembled-test.repository";
import { AssemblyRepository } from "../../assembly/repositories/assembly.repository";
import { AssemblyAuditRepository } from "../../assembly/repositories/assembly-audit.repository";
import { AssemblyAuditService } from "../../assembly/services/assembly-audit.service";
import { ORACLE_PROVIDERS_TOKEN } from "../../coding/oracles/oracle.constants";

describe("E2E Real Database Flow — Topic -> Concept -> Coding Pattern -> Assembly -> Candidate Boundary", () => {
  jest.setTimeout(60000);

  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let selectorService: CodingPatternSelectorService;
  let codingStrategy: CodingPatternGenerationStrategy;
  let questionAssembler: QuestionAssemblerService;
  let questionRepo: QuestionRepository;
  let executionService: ExecutionService;
  let persistenceService: AssemblyPersistenceService;

  const testPrefix = `e2e_${Date.now()}`;
  let userId: string;
  let topicId: string;
  let conceptId: string;
  let patternId: string;
  let templateId: string;
  let examConfigId: string;
  let createdQuestionId: string;
  let testInstanceId: string;

  beforeAll(async () => {
    const arrayRotationOracle = new ArrayRotationOracle();

    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        CodingPatternRepository,
        CodingOracleRepository,
        CodingOracleService,
        ArrayRotationOracle,
        {
          provide: ORACLE_PROVIDERS_TOKEN,
          useValue: [arrayRotationOracle],
        },
        OracleRegistry,
        SeededParameterGeneratorService,
        TestSuiteGeneratorService,
        ParameterValidator,
        ConstraintValidator,
        OracleValidator,
        TestCaseValidator,
        DifficultyValidator,
        PatternValidatorService,
        PatternExecutionService,
        CodingPatternSelectorService,
        CodingStatementGeneratorService,
        CodingPatternGenerationStrategy,
        QuestionAssemblerService,
        QuestionRepository,
        TestInstanceRepository,
        ExecutionValidatorService,
        ExecutionService,
        AssembledTestRepository,
        AssemblyRepository,
        AssemblyAuditRepository,
        AssemblyAuditService,
        AssemblyPersistenceService,
      ],
    }).compile();

    await moduleRef.init();

    prisma = moduleRef.get<PrismaService>(PrismaService);
    selectorService = moduleRef.get<CodingPatternSelectorService>(CodingPatternSelectorService);
    codingStrategy = moduleRef.get<CodingPatternGenerationStrategy>(CodingPatternGenerationStrategy);
    questionAssembler = moduleRef.get<QuestionAssemblerService>(QuestionAssemblerService);
    questionRepo = moduleRef.get<QuestionRepository>(QuestionRepository);
    executionService = moduleRef.get<ExecutionService>(ExecutionService);
    persistenceService = moduleRef.get<AssemblyPersistenceService>(AssemblyPersistenceService);

    // 0. Seed Real User
    const user = await prisma.user.create({
      data: {
        email: `cand_${testPrefix}@test.com`,
        fullName: "E2E Candidate",
        role: "CANDIDATE",
      },
    });
    userId = user.id;

    // 1. Seed Real DB Topic & Concept
    const topic = await prisma.topic.create({
      data: {
        code: `topic_${testPrefix}`,
        name: `Data Structures ${testPrefix}`,
        description: "E2E Test Topic",
      },
    });
    topicId = topic.id;

    const concept = await prisma.concept.create({
      data: {
        code: `concept_array_${testPrefix}`,
        name: `Array Operations ${testPrefix}`,
        topicId: topic.id,
      },
    });
    conceptId = concept.id;

    // 2. Seed Real DB Template
    const template = await prisma.template.create({
      data: {
        templateKey: `tmpl_key_${testPrefix}`,
        conceptKey: concept.code,
        difficultyLevel: DifficultyLevel.MEDIUM,
        generationStrategy: ((GenerationStrategy as any).CODING_PATTERN || "CODING_PATTERN") as GenerationStrategy,
        name: `E2E Template ${testPrefix}`,
      },
    });
    templateId = template.id;

    // 3. Seed Real DB ExamConfig
    const examConfig = await prisma.examConfig.create({
      data: {
        code: `cfg_${testPrefix}`,
        name: `E2E Exam Config ${testPrefix}`,
        role: "SOFTWARE_ENGINEER",
        durationMinutes: 60,
        totalQuestions: 1,
      },
    });
    examConfigId = examConfig.id;

    // 4. Seed Real DB Coding Pattern linked to standard ARRAY_ROTATION_ORACLE
    const pattern = await prisma.codingPattern.create({
      data: {
        patternKey: `pat_key_${testPrefix}`,
        title: `Array Left Rotation ${testPrefix}`,
        slug: `array-left-rotation-${testPrefix}`,
        description: "Rotate array to left by K positions.",
        difficulty: DifficultyLevel.MEDIUM,
        status: CodingPatternStatus.PUBLISHED,
        oracleKey: "ARRAY_ROTATION_ORACLE",
        parameterSchema: {
          arraySize: { type: "integer", min: 3, max: 10 },
          shift: { type: "integer", min: 1, max: 3 },
        },
        starterCode: { javascript: "function rotateLeft(arr, k) {}" },
        metadata: { conceptKey: concept.code, topicId: topic.id },
      },
    });
    patternId = pattern.id;
  });

  afterAll(async () => {
    try {
      if (testInstanceId) {
        await prisma.testInstanceQuestion.deleteMany({ where: { testInstanceId } });
        await prisma.testInstanceSection.deleteMany({ where: { testInstanceId } });
        await prisma.testInstance.delete({ where: { id: testInstanceId } }).catch(() => null);
      }
      if (createdQuestionId) {
        await prisma.question.delete({ where: { id: createdQuestionId } }).catch(() => null);
      }
      if (templateId) {
        await prisma.template.delete({ where: { id: templateId } }).catch(() => null);
      }
      if (patternId) {
        await prisma.codingPattern.delete({ where: { id: patternId } }).catch(() => null);
      }
      if (conceptId) {
        await prisma.concept.delete({ where: { id: conceptId } }).catch(() => null);
      }
      if (topicId) {
        await prisma.topic.delete({ where: { id: topicId } }).catch(() => null);
      }
      if (examConfigId) {
        await prisma.examConfig.delete({ where: { id: examConfigId } }).catch(() => null);
      }
      if (userId) {
        await prisma.user.delete({ where: { id: userId } }).catch(() => null);
      }
    } catch {
      // Cleanup fallback
    }
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it("1. Should resolve Topic -> Concept -> Coding Pattern from PostgreSQL database", async () => {
    const selected = await selectorService.selectPattern({
      topicId,
      conceptKey: `concept_array_${testPrefix}`,
      difficulty: DifficultyLevel.MEDIUM,
    });

    expect(selected).toBeDefined();
    expect(selected.id).toBe(patternId);
    expect(selected.oracleKey).toBe("ARRAY_ROTATION_ORACLE");
  });

  it("2. Should generate and persist Coding Question to real PostgreSQL table with CODING_PATTERN strategy", async () => {
    const dbTemplate = await prisma.template.findUniqueOrThrow({ where: { id: templateId } });

    // Generate via strategy
    const context = await codingStrategy.generate(dbTemplate);
    expect(context.strategy).toBe(GenerationStrategy.CODING_PATTERN);

    const payload = context.payload as any;
    const rawQuestion = {
      questionText: payload.aiStatement?.narrative || "Rotate array left by K positions.",
      options: [],
      correctAnswer: JSON.stringify(payload.expectedOutput),
      explanation: "Standard array rotation constraint.",
    };

    // Assemble question
    const assembled = questionAssembler.assemble(
      context,
      rawQuestion,
      dbTemplate.id,
      topicId,
    );

    // Save to real database table
    const saved = await questionRepo.save(assembled);
    createdQuestionId = saved.id;

    expect(saved.id).toBeDefined();
    expect(saved.questionType).toBe("CODING");
    expect(saved.codingData).toBeDefined();
    expect(saved.codingData.oracleKey).toBe("ARRAY_ROTATION_ORACLE");
    expect(saved.codingData.hiddenTests.length).toBeGreaterThan(0);
    expect(saved.codingData.stressTests.length).toBeGreaterThan(0);
  });

  it("3. Should assemble TestInstance and verify Candidate API Hidden-Test Boundary", async () => {
    // 1. Create real assembly TestInstance with allocated question using valid examConfigId
    testInstanceId = await persistenceService.saveAssembly(
      examConfigId,
      [
        {
          sectionKey: "coding_sec",
          displayName: "Coding Section",
          durationSeconds: 1800,
          questionCount: 1,
          orderIndex: 0,
          questions: [
            {
              questionId: createdQuestionId,
              questionHash: createdQuestionId,
              conceptKey: `concept_array_${testPrefix}`,
              difficultyLevel: DifficultyLevel.MEDIUM,
              questionType: "CODING",
              questionOrder: 0,
              questionSnapshot: {
                id: createdQuestionId,
                questionType: "CODING",
                questionText: "Array Left Rotation Challenge",
                options: [],
                codingData: {
                  oracleKey: "ARRAY_ROTATION_ORACLE",
                  patternKey: `pat_key_${testPrefix}`,
                  publicTests: [{ input: { arr: [1, 2, 3], shift: 1 }, expectedOutput: { result: [2, 3, 1] } }],
                  hiddenTests: [{ input: { arr: [9, 8, 7], shift: 2 }, expectedOutput: { result: [7, 9, 8] } }],
                  stressTests: [{ input: { arr: [100], shift: 10 }, expectedOutput: { result: [100] } }],
                  expectedOutput: { result: [2, 3, 1] },
                  starterCode: { javascript: "function rotateLeft(arr, k) {}" },
                },
              },
            },
          ],
        },
      ],
      userId,
    );

    // 2. Fetch candidate test snapshot via ExecutionService (Candidate API layer)
    const snapshot = await executionService.loadAssessment(testInstanceId, userId);
    expect(snapshot).toBeDefined();

    const candidateQuestion = snapshot.sections[0].questions[0];
    const candidateSnapshot = candidateQuestion.snapshot as any;

    expect(candidateSnapshot).toBeDefined();
    expect(candidateSnapshot.codingData).toBeDefined();

    // 3. VERIFY HIDDEN TEST & SECRET BOUNDARY: candidate API MUST NOT return hiddenTests, stressTests, or expectedOutput!
    expect(candidateSnapshot.codingData.publicTests).toBeDefined();
    expect(candidateSnapshot.codingData.publicTests.length).toBe(1);

    expect(candidateSnapshot.codingData.hiddenTests).toBeUndefined();
    expect(candidateSnapshot.codingData.stressTests).toBeUndefined();
    expect(candidateSnapshot.codingData.expectedOutput).toBeUndefined();
    expect(candidateSnapshot.correctAnswer).toBeUndefined();
    expect(candidateSnapshot.solution).toBeUndefined();
  });
});
