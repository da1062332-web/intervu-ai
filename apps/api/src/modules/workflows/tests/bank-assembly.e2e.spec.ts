import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { AssembledTestRepository } from "../../assembly/repositories/assembled-test.repository";
import { AssemblyStatus } from "@prisma/client";

describe("Workflow E2E — Question Bank to Assembly Builder", () => {
  let repository: AssembledTestRepository;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      assembledTest: {
        create: jest.fn().mockResolvedValue({ id: "asm-001" }),
      },
      assembledTestSection: {
        create: jest.fn().mockResolvedValue({ id: "sec-001" }),
      },
      assembledTestQuestion: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssembledTestRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = module.get<AssembledTestRepository>(AssembledTestRepository);
  });

  it("should persist an assembled test structure with sections and questions atomically", async () => {
    const sections = [
      {
        sectionKey: "sec-01",
        displayName: "Coding Section",
        durationSeconds: 1800,
        questionCount: 2,
        orderIndex: 0,
        questions: [
          {
            questionId: "q-001",
            questionOrder: 0,
            questionSnapshot: { text: "Solve sum problem" },
            questionHash: "hash-001",
            conceptKey: "sum_vars",
            difficultyLevel: "EASY",
            questionType: "mcq",
          },
          {
            questionId: "q-002",
            questionOrder: 1,
            questionSnapshot: { text: "Solve array problem" },
            questionHash: "hash-002",
            conceptKey: "array_vars",
            difficultyLevel: "EASY",
            questionType: "mcq",
          },
        ],
      },
    ];

    const result = await repository.createAssemblyWithTransaction(
      "config-1",
      sections,
      1800,
      2,
    );

    expect(result).toBe("asm-001");

    // Verify transaction executes create on assembledTest
    expect(prismaMock.assembledTest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          configId: "config-1",
          status: AssemblyStatus.DRAFT,
          totalDurationSeconds: 1800,
          totalQuestions: 2,
        }),
      }),
    );

    // Verify section is created
    expect(prismaMock.assembledTestSection.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          assemblyId: "asm-001",
          sectionKey: "sec-01",
        }),
      }),
    );

    // Verify questions are chunk created
    expect(prismaMock.assembledTestQuestion.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            questionId: "q-001",
            questionOrder: 0,
          }),
        ]),
      }),
    );
  });
});
