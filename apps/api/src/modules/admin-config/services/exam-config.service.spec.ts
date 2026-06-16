import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { ExamConfigService } from "./exam-config.service";
import { ExamConfigRepository } from "../repositories/exam-config.repository";
import { CreateExamConfigDto } from "@intervu/shared";

describe("ExamConfigService", () => {
  let service: ExamConfigService;
  let repository: jest.Mocked<ExamConfigRepository>;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    } as unknown as jest.Mocked<ExamConfigRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamConfigService,
        { provide: ExamConfigRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<ExamConfigService>(ExamConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should successfully create an exam config via repository", async () => {
      const dto: CreateExamConfigDto = {
        name: "Test Config",
        role: "Software Engineer",
        durationMinutes: 60,
        totalQuestions: 30,
      };
      const createdBy = "admin-1";
      const expectedResult = {
        id: "config-uuid",
        ...dto,
        createdBy,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.create.mockResolvedValueOnce(expectedResult);

      const result = await service.create(dto, createdBy);

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        createdBy,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe("findAll", () => {
    it("should return all active exam configurations", async () => {
      const activeConfigs = [
        {
          id: "config-1",
          name: "Config 1",
          role: "Role 1",
          durationMinutes: 60,
          totalQuestions: 30,
          isActive: true,
          createdBy: "admin-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      repository.findAll.mockResolvedValueOnce(activeConfigs);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalledWith({ isActive: true });
      expect(result).toEqual(activeConfigs);
    });
  });

  describe("findOne", () => {
    it("should return config details if active", async () => {
      const activeConfig = {
        id: "config-1",
        name: "Config 1",
        role: "Role 1",
        durationMinutes: 60,
        totalQuestions: 30,
        isActive: true,
        createdBy: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findById.mockResolvedValueOnce(activeConfig);

      const result = await service.findOne("config-1");

      expect(repository.findById).toHaveBeenCalledWith("config-1");
      expect(result).toEqual(activeConfig);
    });

    it("should throw NotFoundException if config does not exist", async () => {
      repository.findById.mockResolvedValueOnce(null);

      await expect(service.findOne("config-not-exist")).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findById).toHaveBeenCalledWith("config-not-exist");
    });

    it("should throw NotFoundException if config is inactive", async () => {
      const inactiveConfig = {
        id: "config-inactive",
        name: "Config Inactive",
        role: "Role 1",
        durationMinutes: 60,
        totalQuestions: 30,
        isActive: false,
        createdBy: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findById.mockResolvedValueOnce(inactiveConfig);

      await expect(service.findOne("config-inactive")).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.findById).toHaveBeenCalledWith("config-inactive");
    });
  });
});
