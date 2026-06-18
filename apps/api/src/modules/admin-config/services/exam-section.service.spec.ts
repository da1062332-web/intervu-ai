import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { ExamSectionService } from "./exam-section.service";
import { ExamSectionRepository } from "../repositories/exam-section.repository";
import { ExamConfigRepository } from "../repositories/exam-config.repository";
import { CreateExamSectionDto, UpdateExamSectionDto } from "@intervu/shared";
import { ConfigStatus, ExamConfig, ExamSection } from "@prisma/client";

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
      findByConfigAndCode: jest.fn(),
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
      code: "QUANT",
      questionCount: 10,
      sectionDurationMinutes: 20,
      sectionOrder: 1,
      isRequired: true,
    };

    const parentConfig: ExamConfig = {
      id: configId,
      name: "Test Exam",
      code: "TEST_EXAM",
      role: "Dev",
      description: null,
      durationMinutes: 60,
      totalQuestions: 30,
      status: ConfigStatus.DRAFT,
      isArchived: false,
      isActive: true,
      createdBy: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should successfully create a new section", async () => {
      configRepo.findById.mockResolvedValueOnce(parentConfig);
      sectionRepo.findByConfigAndCode.mockResolvedValueOnce(null);
      sectionRepo.findByConfigAndOrder.mockResolvedValueOnce(null);

      const expectedResult: ExamSection = {
        id: "section-cuid",
        examConfigId: configId,
        name: dto.name,
        code: dto.code,
        questionCount: dto.questionCount,
        sectionDurationMinutes: dto.sectionDurationMinutes,
        sectionOrder: dto.sectionOrder,
        isRequired: dto.isRequired,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.create.mockResolvedValueOnce(expectedResult);

      const result = await service.createSection(configId, dto);

      expect(configRepo.findById).toHaveBeenCalledWith(configId);
      expect(sectionRepo.findByConfigAndCode).toHaveBeenCalledWith(configId, dto.code);
      expect(sectionRepo.findByConfigAndOrder).toHaveBeenCalledWith(configId, dto.sectionOrder);
      expect(result).toEqual(expectedResult);
    });

    it("should throw NotFoundException if parent ExamConfig does not exist", async () => {
      configRepo.findById.mockResolvedValueOnce(null);

      await expect(service.createSection(configId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException if parent ExamConfig is archived", async () => {
      const archivedConfig: ExamConfig = {
        ...parentConfig,
        status: ConfigStatus.ARCHIVED,
        isArchived: true,
      };
      configRepo.findById.mockResolvedValueOnce(archivedConfig);

      await expect(service.createSection(configId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw ConflictException if code is already in use", async () => {
      configRepo.findById.mockResolvedValueOnce(parentConfig);

      const existingSection: ExamSection = {
        id: "existing-section-id",
        examConfigId: configId,
        name: "Old Section",
        code: dto.code,
        questionCount: 10,
        sectionDurationMinutes: 20,
        sectionOrder: 2,
        isRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.findByConfigAndCode.mockResolvedValueOnce(existingSection);

      await expect(service.createSection(configId, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should throw ConflictException if sectionOrder is already in use", async () => {
      configRepo.findById.mockResolvedValueOnce(parentConfig);
      sectionRepo.findByConfigAndCode.mockResolvedValueOnce(null);

      const existingSection: ExamSection = {
        id: "existing-section-id",
        examConfigId: configId,
        name: "Old Section",
        code: "OTHER_CODE",
        questionCount: 10,
        sectionDurationMinutes: 20,
        sectionOrder: dto.sectionOrder,
        isRequired: true,
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

    const parentConfig: ExamConfig = {
      id: configId,
      name: "Test Exam",
      code: "TEST_EXAM",
      role: "Dev",
      description: null,
      durationMinutes: 60,
      totalQuestions: 30,
      status: ConfigStatus.DRAFT,
      isArchived: false,
      isActive: true,
      createdBy: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should return sections list for a valid config id", async () => {
      configRepo.findById.mockResolvedValueOnce(parentConfig);

      const sections: ExamSection[] = [
        {
          id: "section-1",
          examConfigId: configId,
          name: "Section 1",
          code: "SEC1",
          questionCount: 15,
          sectionDurationMinutes: 30,
          sectionOrder: 1,
          isRequired: true,
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
      code: "UPDATED_QUANT",
      sectionOrder: 2,
    };

    const parentConfig: ExamConfig = {
      id: "config-uuid",
      name: "Test Exam",
      code: "TEST_EXAM",
      role: "Dev",
      description: null,
      durationMinutes: 60,
      totalQuestions: 30,
      status: ConfigStatus.DRAFT,
      isArchived: false,
      isActive: true,
      createdBy: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should update section successfully", async () => {
      const existingSection: ExamSection = {
        id: sectionId,
        examConfigId: "config-uuid",
        name: "Quant Section",
        code: "QUANT",
        questionCount: 10,
        sectionDurationMinutes: 20,
        sectionOrder: 1,
        isRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.findById.mockResolvedValueOnce(existingSection);
      configRepo.findById.mockResolvedValueOnce(parentConfig);
      sectionRepo.findByConfigAndOrder.mockResolvedValueOnce(null);
      sectionRepo.findByConfigAndCode.mockResolvedValueOnce(null);

      const expectedResult: ExamSection = {
        ...existingSection,
        name: dto.name!,
        code: dto.code!,
        sectionOrder: dto.sectionOrder!,
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

    it("should throw BadRequestException if parent ExamConfig is archived", async () => {
      const existingSection: ExamSection = {
        id: sectionId,
        examConfigId: "config-uuid",
        name: "Quant Section",
        code: "QUANT",
        questionCount: 10,
        sectionDurationMinutes: 20,
        sectionOrder: 1,
        isRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const archivedConfig: ExamConfig = {
        ...parentConfig,
        status: ConfigStatus.ARCHIVED,
        isArchived: true,
      };

      sectionRepo.findById.mockResolvedValueOnce(existingSection);
      configRepo.findById.mockResolvedValueOnce(archivedConfig);

      await expect(service.updateSection(sectionId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw ConflictException if updated sectionOrder is already in use", async () => {
      const existingSection: ExamSection = {
        id: sectionId,
        examConfigId: "config-uuid",
        name: "Quant Section",
        code: "QUANT",
        questionCount: 10,
        sectionDurationMinutes: 20,
        sectionOrder: 1,
        isRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.findById.mockResolvedValueOnce(existingSection);
      configRepo.findById.mockResolvedValueOnce(parentConfig);

      const conflictingSection: ExamSection = {
        id: "conflict-id",
        examConfigId: "config-uuid",
        name: "Conflict Section",
        code: "OTHER_CODE",
        questionCount: 10,
        sectionDurationMinutes: 20,
        sectionOrder: dto.sectionOrder!,
        isRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.findByConfigAndOrder.mockResolvedValueOnce(
        conflictingSection,
      );

      await expect(service.updateSection(sectionId, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should throw ConflictException if updated code is already in use", async () => {
      const existingSection: ExamSection = {
        id: sectionId,
        examConfigId: "config-uuid",
        name: "Quant Section",
        code: "QUANT",
        questionCount: 10,
        sectionDurationMinutes: 20,
        sectionOrder: 1,
        isRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.findById.mockResolvedValueOnce(existingSection);
      configRepo.findById.mockResolvedValueOnce(parentConfig);
      sectionRepo.findByConfigAndOrder.mockResolvedValueOnce(null);

      const conflictingSection: ExamSection = {
        id: "conflict-id",
        examConfigId: "config-uuid",
        name: "Conflict Section",
        code: dto.code!,
        questionCount: 10,
        sectionDurationMinutes: 20,
        sectionOrder: 3,
        isRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.findByConfigAndCode.mockResolvedValueOnce(
        conflictingSection,
      );

      await expect(service.updateSection(sectionId, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("deleteSection", () => {
    const sectionId = "section-cuid";

    const parentConfig: ExamConfig = {
      id: "config-uuid",
      name: "Test Exam",
      code: "TEST_EXAM",
      role: "Dev",
      description: null,
      durationMinutes: 60,
      totalQuestions: 30,
      status: ConfigStatus.DRAFT,
      isArchived: false,
      isActive: true,
      createdBy: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should delete section successfully", async () => {
      const existingSection: ExamSection = {
        id: sectionId,
        examConfigId: "config-uuid",
        name: "Quant Section",
        code: "QUANT",
        questionCount: 10,
        sectionDurationMinutes: 20,
        sectionOrder: 1,
        isRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      sectionRepo.findById.mockResolvedValueOnce(existingSection);
      configRepo.findById.mockResolvedValueOnce(parentConfig);
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

    it("should throw BadRequestException if parent ExamConfig is archived", async () => {
      const existingSection: ExamSection = {
        id: sectionId,
        examConfigId: "config-uuid",
        name: "Quant Section",
        code: "QUANT",
        questionCount: 10,
        sectionDurationMinutes: 20,
        sectionOrder: 1,
        isRequired: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const archivedConfig: ExamConfig = {
        ...parentConfig,
        status: ConfigStatus.ARCHIVED,
        isArchived: true,
      };

      sectionRepo.findById.mockResolvedValueOnce(existingSection);
      configRepo.findById.mockResolvedValueOnce(archivedConfig);

      await expect(service.deleteSection(sectionId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
