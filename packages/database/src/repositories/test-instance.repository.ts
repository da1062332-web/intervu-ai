import { prisma } from '../client';
import { RepositoryError } from '../types/database.types';
import type { Prisma, Test } from '@prisma/client';

export class TestInstanceRepository {
  private validate(input: any) {
    if (!input) throw new RepositoryError('INVALID_INPUT', 'Input cannot be null or undefined.');
  }

  async findById(id: string): Promise<Test | null> {
    this.validate(id);
    try {
      return await prisma.test.findUnique({
        where: { id },
      });
    } catch (error: any) {
      throw new RepositoryError('DB_ERROR', error.message);
    }
  }

  async update(id: string, data: Prisma.TestUpdateInput): Promise<Test> {
    this.validate(id);
    this.validate(data);
    try {
      return await prisma.test.update({
        where: { id },
        data,
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new RepositoryError('NOT_FOUND', 'Test instance not found.');
      }
      throw new RepositoryError('DB_ERROR', error.message);
    }
  }
}
