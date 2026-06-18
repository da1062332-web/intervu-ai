import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { ExamConfig } from "@prisma/client";
import { ExamConfigRepository } from "../repositories/exam-config.repository";
import { CreateExamConfigDto, UpdateExamConfigDto } from "@intervu/shared";

@Injectable()
export class ExamConfigService {
  constructor(private readonly examConfigRepository: ExamConfigRepository) {}

  async create(
    dto: CreateExamConfigDto,
    createdBy?: string,
  ): Promise<ExamConfig> {
    const existing = await this.examConfigRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Exam config with code ${dto.code} already exists`);
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

  async findOne(id: string): Promise<ExamConfig> {
    const config = await this.examConfigRepository.findById(id);
    if (!config || !config.isActive) {
      throw new NotFoundException(`Exam config with ID "${id}" not found`);
    }
    return config;
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
        throw new ConflictException(`Exam config with code ${dto.code} already exists`);
      }
    }

    return this.examConfigRepository.update(id, dto);
  }

  async archive(id: string): Promise<ExamConfig> {
    const config = await this.examConfigRepository.findById(id);
    if (!config) {
      throw new NotFoundException(`Exam config with ID "${id}" not found`);
    }

    return this.examConfigRepository.update(id, {
      isArchived: true,
      status: "ARCHIVED",
    });
  }
}
