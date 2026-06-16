import {
  Injectable,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { ExamSectionRepository } from "../repositories/exam-section.repository";
import { ExamConfigRepository } from "../repositories/exam-config.repository";
import { CreateExamSectionDto, UpdateExamSectionDto } from "@intervu/shared";

@Injectable()
export class ExamSectionService {
  constructor(
    private readonly sectionRepo: ExamSectionRepository,
    private readonly configRepo: ExamConfigRepository,
  ) {}

  async createSection(configId: string, dto: CreateExamSectionDto) {
    const config = await this.configRepo.findById(configId);
    if (!config) {
      throw new NotFoundException(
        `Exam configuration with ID ${configId} not found`,
      );
    }

    const existingOrder = await this.sectionRepo.findByConfigAndOrder(
      configId,
      dto.displayOrder,
    );
    if (existingOrder) {
      throw new ConflictException(
        `Display order ${dto.displayOrder} is already in use for this configuration`,
      );
    }

    // Build Prisma create data input
    const createData = {
      name: dto.name,
      questionCount: dto.questionCount,
      durationMinutes: dto.durationMinutes,
      displayOrder: dto.displayOrder,
      examConfig: {
        connect: { id: configId },
      },
    };

    return this.sectionRepo.create(createData);
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

    if (
      dto.displayOrder !== undefined &&
      dto.displayOrder !== section.displayOrder
    ) {
      const existingOrder = await this.sectionRepo.findByConfigAndOrder(
        section.examConfigId,
        dto.displayOrder,
      );
      if (existingOrder && existingOrder.id !== sectionId) {
        throw new ConflictException(
          `Display order ${dto.displayOrder} is already in use for this configuration`,
        );
      }
    }

    return this.sectionRepo.update(sectionId, dto);
  }

  async deleteSection(sectionId: string) {
    const section = await this.sectionRepo.findById(sectionId);
    if (!section) {
      throw new NotFoundException(`Section with ID ${sectionId} not found`);
    }
    return this.sectionRepo.delete(sectionId);
  }
}
