import { prisma } from '../client';
import { RepositoryError } from '../types/database.types';
import type { Prisma, GeneratedQuestion, DifficultyLevel } from '@prisma/client';

export interface QuestionPoolFilter {
  conceptKey?: string;
  difficultyLevel?: DifficultyLevel;
  questionType?: string;
  templateId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export class QuestionPoolRepository {
  private validate(input: any) {
    if (input === null || input === undefined) {
      throw new RepositoryError('INVALID_INPUT', 'Input cannot be null or undefined.');
    }
  }

  private buildWhereClause(filters: QuestionPoolFilter): Prisma.GeneratedQuestionWhereInput {
    const where: Prisma.GeneratedQuestionWhereInput = {};
    if (filters.conceptKey) where.conceptKey = filters.conceptKey;
    if (filters.difficultyLevel) where.difficultyLevel = filters.difficultyLevel;
    if (filters.questionType) where.questionType = filters.questionType;
    if (filters.templateId) where.templateId = filters.templateId;
    return where;
  }

  async findQuestions(filters: QuestionPoolFilter, pagination?: PaginationParams): Promise<GeneratedQuestion[]> {
    try {
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 50;
      const skip = (page - 1) * limit;

      return await prisma.generatedQuestion.findMany({
        where: this.buildWhereClause(filters),
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: any) {
      throw new RepositoryError('DB_ERROR', error.message);
    }
  }

  async findByConcept(conceptKey: string): Promise<GeneratedQuestion[]> {
    this.validate(conceptKey);
    return this.findQuestions({ conceptKey });
  }

  async findByDifficulty(difficultyLevel: DifficultyLevel): Promise<GeneratedQuestion[]> {
    this.validate(difficultyLevel);
    return this.findQuestions({ difficultyLevel });
  }

  async findByConceptAndDifficulty(conceptKey: string, difficultyLevel: DifficultyLevel): Promise<GeneratedQuestion[]> {
    this.validate(conceptKey);
    this.validate(difficultyLevel);
    return this.findQuestions({ conceptKey, difficultyLevel });
  }

  async count(filters: QuestionPoolFilter = {}): Promise<number> {
    try {
      return await prisma.generatedQuestion.count({
        where: this.buildWhereClause(filters),
      });
    } catch (error: any) {
      throw new RepositoryError('DB_ERROR', error.message);
    }
  }

  /**
   * Retrieves a strict, distinct set of randomized questions matching the filters.
   * Employs the In-Memory ID Shuffle strategy to maintain full Prisma Type Safety
   * while ensuring no duplicate IDs are ever returned in a single request (POOL-009).
   */
  async findRandomizedSet(filters: QuestionPoolFilter, count: number): Promise<GeneratedQuestion[]> {
    this.validate(count);
    if (count <= 0) return [];

    try {
      // 1. Fetch only IDs that match the filter for high performance
      const availableRecords = await prisma.generatedQuestion.findMany({
        where: this.buildWhereClause(filters),
        select: { id: true },
      });

      if (availableRecords.length === 0) return [];

      // 2. Extract IDs
      const allIds = availableRecords.map(record => record.id);

      // 3. In-Memory Fisher-Yates Shuffle
      for (let i = allIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
      }

      // 4. Slice the exact number needed (automatically bounds to available length if count > length)
      const selectedIds = allIds.slice(0, count);

      // 5. Fetch fully typed records using the distinct shuffled IDs
      const randomizedQuestions = await prisma.generatedQuestion.findMany({
        where: {
          id: { in: selectedIds }
        }
      });

      // 6. Prisma `in` does not guarantee order, so we map them back to the shuffled order
      const orderedQuestions = selectedIds.map(id => randomizedQuestions.find(q => q.id === id)).filter(Boolean) as GeneratedQuestion[];

      return orderedQuestions;
    } catch (error: any) {
      throw new RepositoryError('DB_ERROR', error.message);
    }
  }
}
