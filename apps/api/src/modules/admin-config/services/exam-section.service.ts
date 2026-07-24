import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { ExamSectionRepository } from "../repositories/exam-section.repository";
import { ExamConfigRepository } from "../repositories/exam-config.repository";
import { CreateExamSectionDto, UpdateExamSectionDto } from "@intervu/shared";
import { RedisCacheService } from "../../../cache/redis-cache.service";

@Injectable()
export class ExamSectionService {
  constructor(
    private readonly sectionRepo: ExamSectionRepository,
    private readonly configRepo: ExamConfigRepository,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async createSection(configId: string, dto: CreateExamSectionDto) {
    const config = await this.configRepo.findById(configId);
    if (!config) {
      throw new NotFoundException(
        `Exam configuration with ID ${configId} not found`,
      );
    }

    if (config.isArchived || config.status === "ARCHIVED") {
      throw new BadRequestException({
        code: "CONFIG_ARCHIVED",
        error: "CONFIG_ARCHIVED",
        message: "Archived configurations cannot be modified",
      });
    }

    const existingCode = await this.sectionRepo.findByConfigAndCode(
      configId,
      dto.code,
    );
    if (existingCode) {
      throw new ConflictException(
        `Section code ${dto.code} is already in use for this configuration`,
      );
    }

    const existingOrder = await this.sectionRepo.findByConfigAndOrder(
      configId,
      dto.sectionOrder,
    );
    if (existingOrder) {
      throw new ConflictException(
        `Section order ${dto.sectionOrder} is already in use for this configuration`,
      );
    }

    // Build Prisma create data input
    const createData = {
      name: dto.name,
      code: dto.code,
      questionCount: dto.questionCount,
      sectionDurationMinutes: dto.sectionDurationMinutes,
      sectionOrder: dto.sectionOrder,
      isRequired: dto.isRequired ?? true,
      examConfig: {
        connect: { id: configId },
      },
    };

    const created = await this.sectionRepo.create(createData);
    await this.redisCacheService.invalidateBlueprint(configId);
    return created;
  }

  async getSections(configId: string) {
    const config = await this.configRepo.findById(configId);
    if (!config) {
      throw new NotFoundException(
        `Exam configuration with ID ${configId} not found`,
      );
    }
    return this.sectionRepo.findManyByConfigId(configId);
  }

  async updateSection(sectionId: string, dto: UpdateExamSectionDto) {
    const section = await this.sectionRepo.findById(sectionId);
    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    const config = await this.configRepo.findById(section.examConfigId);
    if (config && (config.isArchived || config.status === "ARCHIVED")) {
      throw new BadRequestException({
        code: "CONFIG_ARCHIVED",
        error: "CONFIG_ARCHIVED",
        message: "Archived configurations cannot be modified",
      });
    }

    if (
      dto.sectionOrder !== undefined &&
      dto.sectionOrder !== section.sectionOrder
    ) {
      const existingOrder = await this.sectionRepo.findByConfigAndOrder(
        section.examConfigId,
        dto.sectionOrder,
      );
      if (existingOrder && existingOrder.id !== sectionId) {
        throw new ConflictException(
          `Section order ${dto.sectionOrder} is already in use for this configuration`,
        );
      }
    }

    if (dto.code !== undefined && dto.code !== section.code) {
      const existingCode = await this.sectionRepo.findByConfigAndCode(
        section.examConfigId,
        dto.code,
      );
      if (existingCode && existingCode.id !== sectionId) {
        throw new ConflictException(
          `Section code ${dto.code} is already in use for this configuration`,
        );
      }
    }

    const updated = await this.sectionRepo.update(sectionId, dto);
    await this.redisCacheService.invalidateBlueprint(section.examConfigId);
    return updated;
  }

  async deleteSection(sectionId: string) {
    const section = await this.sectionRepo.findById(sectionId);
    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }

    const config = await this.configRepo.findById(section.examConfigId);
    if (config && (config.isArchived || config.status === "ARCHIVED")) {
      throw new BadRequestException({
        code: "CONFIG_ARCHIVED",
        error: "CONFIG_ARCHIVED",
        message: "Archived configurations cannot be modified",
      });
    }

    const deleted = await this.sectionRepo.delete(sectionId);
    await this.redisCacheService.invalidateBlueprint(section.examConfigId);
    return deleted;
  }
}
