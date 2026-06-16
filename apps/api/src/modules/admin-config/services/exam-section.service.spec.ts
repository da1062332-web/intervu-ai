import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { ExamSectionService } from "./exam-section.service";
import { ExamSectionRepository } from "../repositories/exam-section.repository";
import { ExamConfigRepository } from "../repositories/exam-config.repository";
import { CreateExamSectionDto, UpdateExamSectionDto } from "@intervu/shared";

describe("ExamSectionService", () => {
  let service: ExamSectionService;
  let sectionRepo: jest.Mocked<ExamSectionRepository>;
  let configRepo: jest.Mocked<ExamConfigRepository>;

  beforeEach(async () => {
    sectionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findManyByConfigId: jest.fn(),
      findByConfigAndOrder: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ExamSectionRepository>;

    configRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ExamConfigRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamSectionService,
        { provide: ExamSectionRepository, useValue: sectionRepo },
        { provide: ExamConfigRepository, useValue: configRepo },
      ],
    }).compile();

    service = module.get<ExamSectionService>(ExamSectionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createSection", () => {
    const configId = "config-uuid";
    const dto: CreateExamSectionDto = {
      name: "Quant Section",
      questionCount: 10,
      durationMinutes: 20,
      displayOrder: 1,
    };

    it("should successfully create a new section", async () => {
      const parentConfig = {
        id: configId,
        name: "Test Exam",
        role: "Dev",
        durationMinutes: 60,
        totalQuestions: 30,
        isActive: true,
        createdBy: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      configRepo.findById.mockResolvedValueOnce(parentConfig);
      sectionRepo.findByConfigAndOrder.mockResolvedValueOnce(null);

      const expectedResult = {
        id: "section-cuid",
        examConfigId: configId,
        name: dto.name,
        questionCount: dto.questionCount,
        durationMinutes: dto.durationMinutes ?? null,
        displayOrder: dto.displayOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.create.mockResolvedValueOnce(expectedResult);

      const result = await service.createSection(configId, dto);

      expect(configRepo.findById).toHaveBeenCalledWith(configId);
      expect(sectionRepo.findByConfigAndOrder).toHaveBeenCalledWith(configId, dto.displayOrder);
      expect(result).toEqual(expectedResult);
    });

    it("should throw NotFoundException if parent ExamConfig does not exist", async () => {
      configRepo.findById.mockResolvedValueOnce(null);

      await expect(service.createSection(configId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ConflictException if displayOrder is already in use", async () => {
      const parentConfig = {
        id: configId,
        name: "Test Exam",
        role: "Dev",
        durationMinutes: 60,
        totalQuestions: 30,
        isActive: true,
        createdBy: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      configRepo.findById.mockResolvedValueOnce(parentConfig);

      const existingSection = {
        id: "existing-section-id",
        examConfigId: configId,
        name: "Old Section",
        questionCount: 10,
        durationMinutes: 20,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.findByConfigAndOrder.mockResolvedValueOnce(existingSection);

      await expect(service.createSection(configId, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("getSections", () => {
    const configId = "config-uuid";

    it("should return sections list for a valid config id", async () => {
      const parentConfig = {
        id: configId,
        name: "Test Exam",
        role: "Dev",
        durationMinutes: 60,
        totalQuestions: 30,
        isActive: true,
        createdBy: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      configRepo.findById.mockResolvedValueOnce(parentConfig);

      const sections = [
        {
          id: "section-1",
          examConfigId: configId,
          name: "Section 1",
          questionCount: 15,
          durationMinutes: 30,
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      sectionRepo.findManyByConfigId.mockResolvedValueOnce(sections);

      const result = await service.getSections(configId);

      expect(sectionRepo.findManyByConfigId).toHaveBeenCalledWith(configId);
      expect(result).toEqual(sections);
    });

    it("should throw NotFoundException if config ID does not exist", async () => {
      configRepo.findById.mockResolvedValueOnce(null);

      await expect(service.getSections(configId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateSection", () => {
    const sectionId = "section-cuid";
    const dto: UpdateExamSectionDto = {
      name: "Updated Quant",
      displayOrder: 2,
    };

    it("should update section successfully", async () => {
      const existingSection = {
        id: sectionId,
        examConfigId: "config-uuid",
        name: "Quant Section",
        questionCount: 10,
        durationMinutes: 20,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.findById.mockResolvedValueOnce(existingSection);
      sectionRepo.findByConfigAndOrder.mockResolvedValueOnce(null);

      const expectedResult = {
        ...existingSection,
        ...dto,
        durationMinutes: dto.durationMinutes !== undefined ? dto.durationMinutes : existingSection.durationMinutes,
      };
      sectionRepo.update.mockResolvedValueOnce(expectedResult);

      const result = await service.updateSection(sectionId, dto);

      expect(sectionRepo.findById).toHaveBeenCalledWith(sectionId);
      expect(result).toEqual(expectedResult);
    });

    it("should throw NotFoundException if section does not exist", async () => {
      sectionRepo.findById.mockResolvedValueOnce(null);

      await expect(service.updateSection(sectionId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ConflictException if updated displayOrder is already in use", async () => {
      const existingSection = {
        id: sectionId,
        examConfigId: "config-uuid",
        name: "Quant Section",
        questionCount: 10,
        durationMinutes: 20,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.findById.mockResolvedValueOnce(existingSection);

      const conflictingSection = {
        id: "conflict-id",
        examConfigId: "config-uuid",
        name: "Conflict Section",
        questionCount: 10,
        durationMinutes: 20,
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.findByConfigAndOrder.mockResolvedValueOnce(conflictingSection);

      await expect(service.updateSection(sectionId, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("deleteSection", () => {
    const sectionId = "section-cuid";

    it("should delete section successfully", async () => {
      const existingSection = {
        id: sectionId,
        examConfigId: "config-uuid",
        name: "Quant Section",
        questionCount: 10,
        durationMinutes: 20,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.findById.mockResolvedValueOnce(existingSection);
      sectionRepo.delete.mockResolvedValueOnce(existingSection);

      const result = await service.deleteSection(sectionId);

      expect(sectionRepo.findById).toHaveBeenCalledWith(sectionId);
      expect(sectionRepo.delete).toHaveBeenCalledWith(sectionId);
      expect(result).toEqual(existingSection);
    });

    it("should throw NotFoundException if section does not exist", async () => {
      sectionRepo.findById.mockResolvedValueOnce(null);

      await expect(service.deleteSection(sectionId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
