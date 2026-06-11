import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DifficultyLevel, GeneratedQuestion } from '@prisma/client';

@Injectable()
export class QuestionPoolService {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailableQuestions(
    difficulty: DifficultyLevel,
    excludeIds: string[],
    limit: number
  ): Promise<GeneratedQuestion[]> {
    return this.prisma.generatedQuestion.findMany({
      where: {
        difficultyLevel: difficulty,
        id: { notIn: excludeIds }
      },
      take: limit,
      orderBy: { createdAt: 'asc' } // deterministic ordering
    });
  }
}
