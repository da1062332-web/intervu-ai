import { Injectable } from "@nestjs/common";
import { QuestionRepository } from "../repositories/question.repository";
 
import { SearchFiltersDto } from "../dto/question-bank.dto";
import { Prisma, Question } from "@prisma/client";

export interface PaginatedQuestions {
  questions: Question[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class QuestionSearchService {
  constructor(private readonly questionRepo: QuestionRepository) {}

  /**
   * Searches the question pool with pagination, sorting, and filter parameters.
   */
  async search(filters: SearchFiltersDto): Promise<PaginatedQuestions> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // Enforce max page size of 100
    const skip = (page - 1) * limit;

    const where: Prisma.QuestionWhereInput = {};

    if (filters.topicId) {
      where.topicId = filters.topicId;
    }
    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }
    if (filters.sectionId) {
      where.sectionId = filters.sectionId;
    }
    if (filters.templateId) {
      where.templateId = filters.templateId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sortOrder || "desc";
    const orderBy: Prisma.QuestionOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [questions, total] = await Promise.all([
      this.questionRepo.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.questionRepo.count(where),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      questions,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
