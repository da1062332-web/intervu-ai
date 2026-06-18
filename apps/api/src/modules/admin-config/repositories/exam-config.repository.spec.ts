import { Test, TestingModule } from "@nestjs/testing";
import { ExamConfigRepository } from "./exam-config.repository";
import { PrismaService } from "../../../prisma/prisma.service";

describe("ExamConfigRepository", () => {
  let repository: ExamConfigRepository;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const prismaMock = {
      examConfig: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamConfigRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    repository = module.get<ExamConfigRepository>(ExamConfigRepository);
    prismaService = module.get(PrismaService);
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  describe("create", () => {
    it("should call prisma.examConfig.create", async () => {
      const data = {
        name: "Test Config",
        code: "TEST_CONFIG",
        role: "Software Engineer",
        durationMinutes: 60,
        totalQuestions: 30,
        createdBy: "admin-1",
      };

      await repository.create(data);

      expect(prismaService.examConfig.create).toHaveBeenCalledWith({ data });
    });
  });

  describe("findById", () => {
    it("should call prisma.examConfig.findUnique", async () => {
      const id = "config-uuid";

      await repository.findById(id);

      expect(prismaService.examConfig.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe("findAll", () => {
    it("should call prisma.examConfig.findMany", async () => {
      const where = { isActive: true };

      await repository.findAll(where);

      expect(prismaService.examConfig.findMany).toHaveBeenCalledWith({ where });
    });
  });
});
