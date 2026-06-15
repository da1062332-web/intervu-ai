import { Injectable, NotFoundException } from "@nestjs/common";
import { ExamConfig } from "@prisma/client";
import { ExamConfigRepository } from "../repositories/exam-config.repository";
import { CreateExamConfigDto } from "@intervu/shared";

@Injectable()
export class ExamConfigService {
  constructor(
    private readonly examConfigRepository: ExamConfigRepository,
  ) {}

  async create(dto: CreateExamConfigDto, createdBy?: string): Promise<ExamConfig> {
    return this.examConfigRepository.create({
      ...dto,
      createdBy,
    });
  }

  async findAll(): Promise<ExamConfig[]> {
    return this.examConfigRepository.findAll({ isActive: true });
  }

  async findOne(id: string): Promise<ExamConfig> {
    const config = await this.examConfigRepository.findById(id);
    if (!config || !config.isActive) {
      throw new NotFoundException(`Exam config with ID "${id}" not found`);
    }
    return config;
  }
}
