import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { ExamConfigService } from "./exam-config.service";
import { ExamConfigRepository } from "../repositories/exam-config.repository";
import { CreateExamConfigDto, UpdateExamConfigDto } from "@intervu/shared";
import { ConfigStatus, ExamConfig } from "@prisma/client";

describe("ExamConfigService", () => {
  let service: ExamConfigService;
  let repository: jest.Mocked<ExamConfigRepository>;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCode: jest.fn(),
      update: jest.fn(),
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
    const dto: CreateExamConfigDto = {
      name: "Test Config",
      code: "TEST_CONFIG",
      role: "Software Engineer",
      durationMinutes: 60,
      totalQuestions: 30,
    };
    const createdBy = "admin-1";

    it("should successfully create an exam config via repository", async () => {
      const expectedResult: ExamConfig = {
        id: "config-uuid",
        name: dto.name,
        code: dto.code,
        role: dto.role,
        description: null,
        durationMinutes: dto.durationMinutes,
        totalQuestions: dto.totalQuestions,
        status: ConfigStatus.DRAFT,
        isArchived: false,
        isActive: true,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findByCode.mockResolvedValueOnce(null);
      repository.create.mockResolvedValueOnce(expectedResult);

      const result = await service.create(dto, createdBy);

      expect(repository.findByCode).toHaveBeenCalledWith(dto.code);
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        createdBy,
      });
      expect(result).toEqual(expectedResult);
    });

    it("should throw ConflictException if code already exists", async () => {
      const existingConfig: ExamConfig = {
        id: "config-existing",
        name: "Existing Config",
        code: dto.code,
        role: dto.role,
        description: null,
        durationMinutes: dto.durationMinutes,
        totalQuestions: dto.totalQuestions,
        status: ConfigStatus.ACTIVE,
        isArchived: false,
        isActive: true,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findByCode.mockResolvedValueOnce(existingConfig);

      await expect(service.create(dto, createdBy)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.findByCode).toHaveBeenCalledWith(dto.code);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should return all active non-archived configurations", async () => {
      const activeConfigs: ExamConfig[] = [
        {
          id: "config-1",
          name: "Config 1",
          code: "CONFIG_1",
          role: "Role 1",
          description: null,
          durationMinutes: 60,
          totalQuestions: 30,
          status: ConfigStatus.ACTIVE,
          isArchived: false,
          isActive: true,
          createdBy: "admin-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      repository.findAll.mockResolvedValueOnce(activeConfigs);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalledWith({ isActive: true, isArchived: false });
      expect(result).toEqual(activeConfigs);
    });
  });

  describe("findOne", () => {
    it("should return config details if active", async () => {
      const activeConfig: ExamConfig = {
        id: "config-1",
        name: "Config 1",
        code: "CONFIG_1",
        role: "Role 1",
        description: null,
        durationMinutes: 60,
        totalQuestions: 30,
        status: ConfigStatus.ACTIVE,
        isArchived: false,
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
      const inactiveConfig: ExamConfig = {
        id: "config-inactive",
        name: "Config Inactive",
        code: "CONFIG_INACTIVE",
        role: "Role 1",
        description: null,
        durationMinutes: 60,
        totalQuestions: 30,
        status: ConfigStatus.DRAFT,
        isArchived: false,
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

  describe("update", () => {
    const id = "config-1";
    const dto: UpdateExamConfigDto = {
      name: "Updated Config",
      code: "UPDATED_CODE",
    };

    it("should update config successfully", async () => {
      const existingConfig: ExamConfig = {
        id,
        name: "Old Config",
        code: "OLD_CODE",
        role: "Role 1",
        description: null,
        durationMinutes: 60,
        totalQuestions: 30,
        status: ConfigStatus.DRAFT,
        isArchived: false,
        isActive: true,
        createdBy: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedConfig: ExamConfig = {
        ...existingConfig,
        name: dto.name!,
        code: dto.code!,
      };

      repository.findById.mockResolvedValueOnce(existingConfig);
      repository.findByCode.mockResolvedValueOnce(null);
      repository.update.mockResolvedValueOnce(updatedConfig);

      const result = await service.update(id, dto);

      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(repository.findByCode).toHaveBeenCalledWith(dto.code);
      expect(repository.update).toHaveBeenCalledWith(id, dto);
      expect(result).toEqual(updatedConfig);
    });

    it("should throw NotFoundException if config does not exist", async () => {
      repository.findById.mockResolvedValueOnce(null);

      await expect(service.update(id, dto)).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if config is archived", async () => {
      const archivedConfig: ExamConfig = {
        id,
        name: "Old Config",
        code: "OLD_CODE",
        role: "Role 1",
        description: null,
        durationMinutes: 60,
        totalQuestions: 30,
        status: ConfigStatus.ARCHIVED,
        isArchived: true,
        isActive: true,
        createdBy: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findById.mockResolvedValueOnce(archivedConfig);

      await expect(service.update(id, dto)).rejects.toThrow(BadRequestException);
    });

    it("should throw ConflictException if updated code already exists on another config", async () => {
      const existingConfig: ExamConfig = {
        id,
        name: "Old Config",
        code: "OLD_CODE",
        role: "Role 1",
        description: null,
        durationMinutes: 60,
        totalQuestions: 30,
        status: ConfigStatus.DRAFT,
        isArchived: false,
        isActive: true,
        createdBy: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const otherConfig: ExamConfig = {
        id: "other-id",
        name: "Other Config",
        code: "UPDATED_CODE",
        role: "Role 1",
        description: null,
        durationMinutes: 60,
        totalQuestions: 30,
        status: ConfigStatus.DRAFT,
        isArchived: false,
        isActive: true,
        createdBy: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findById.mockResolvedValueOnce(existingConfig);
      repository.findByCode.mockResolvedValueOnce(otherConfig);

      await expect(service.update(id, dto)).rejects.toThrow(ConflictException);
    });
  });

  describe("archive", () => {
    const id = "config-1";

    it("should archive config successfully", async () => {
      const existingConfig: ExamConfig = {
        id,
        name: "Old Config",
        code: "OLD_CODE",
        role: "Role 1",
        description: null,
        durationMinutes: 60,
        totalQuestions: 30,
        status: ConfigStatus.DRAFT,
        isArchived: false,
        isActive: true,
        createdBy: "admin-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const archivedConfig: ExamConfig = {
        ...existingConfig,
        status: ConfigStatus.ARCHIVED,
        isArchived: true,
      };

      repository.findById.mockResolvedValueOnce(existingConfig);
      repository.update.mockResolvedValueOnce(archivedConfig);

      const result = await service.archive(id);

      expect(repository.findById).toHaveBeenCalledWith(id);
      expect(repository.update).toHaveBeenCalledWith(id, {
        status: ConfigStatus.ARCHIVED,
        isArchived: true,
      });
      expect(result).toEqual(archivedConfig);
    });

    it("should throw NotFoundException if config does not exist", async () => {
      repository.findById.mockResolvedValueOnce(null);

      await expect(service.archive(id)).rejects.toThrow(NotFoundException);
    });
  });
});
