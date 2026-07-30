import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { ExamConfig } from "@prisma/client";
import { ExamConfigRepository } from "../repositories/exam-config.repository";
import { CreateExamConfigDto, UpdateExamConfigDto } from "@intervu/shared";
import { RedisCacheService } from "../../../cache/redis-cache.service";

@Injectable()
export class ExamConfigService {
  constructor(
    private readonly examConfigRepository: ExamConfigRepository,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  async create(
    dto: CreateExamConfigDto,
    createdBy?: string,
  ): Promise<ExamConfig> {
    const existing = await this.examConfigRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(
        `Exam config with code ${dto.code} already exists`,
      );
    }

    return this.examConfigRepository.create({
      ...dto,
      createdBy,
    });
  }

  async findAll(): Promise<ExamConfig[]> {
    return this.examConfigRepository.findAll({
      isActive: true,
      isArchived: false,
    });
  }

  async findOne(id: string): Promise<any> {
    const config = await this.examConfigRepository.findById(id);
    if (!config || !config.isActive) {
      throw new NotFoundException(`Exam config with ID "${id}" not found`);
    }

    const fullConfig = await (this.examConfigRepository as any).prisma.examConfig.findUnique({
      where: { id },
      include: {
        sections: true,
        difficultyDistribution: true,
        ruleFlags: true,
        blueprint: {
          include: {
            styleProfile: true,
          },
        },
      },
    });

    return fullConfig || config;
  }

  async update(id: string, dto: UpdateExamConfigDto): Promise<ExamConfig> {
    const config = await this.examConfigRepository.findById(id);
    if (!config) {
      throw new NotFoundException(`Exam config with ID "${id}" not found`);
    }

    if (config.isArchived || config.status === "ARCHIVED") {
      throw new BadRequestException({
        code: "CONFIG_ARCHIVED",
        error: "CONFIG_ARCHIVED",
        message: "Archived configurations cannot be modified",
      });
    }

    if (dto.code && dto.code !== config.code) {
      const existing = await this.examConfigRepository.findByCode(dto.code);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Exam config with code ${dto.code} already exists`,
        );
      }
    }

    const updated = await this.examConfigRepository.update(id, dto);
    await this.redisCacheService.invalidateBlueprint(id);
    return updated;
  }

  async archive(id: string): Promise<ExamConfig> {
    const config = await this.examConfigRepository.findById(id);
    if (!config) {
      throw new NotFoundException(`Exam config with ID "${id}" not found`);
    }

    const archived = await this.examConfigRepository.update(id, {
      isArchived: true,
      status: "ARCHIVED",
    });
    await this.redisCacheService.invalidateBlueprint(id);
    return archived;
  }
}
