import { CodingPattern, CodingPatternStatus, DifficultyLevel, Prisma } from "@prisma/client";

export interface ICodingPatternRepository {
  create(data: Prisma.CodingPatternCreateInput | Prisma.CodingPatternUncheckedCreateInput): Promise<CodingPattern>;
  findById(id: string): Promise<CodingPattern | null>;
  findByPatternKey(patternKey: string): Promise<CodingPattern | null>;
  findBySlug(slug: string): Promise<CodingPattern | null>;
  findAll(params?: {
    status?: CodingPatternStatus;
    difficulty?: DifficultyLevel;
    oracleKey?: string;
    search?: string;
    skip?: number;
    take?: number;
  }): Promise<{ items: CodingPattern[]; total: number }>;
  update(id: string, data: Prisma.CodingPatternUpdateInput | Prisma.CodingPatternUncheckedUpdateInput): Promise<CodingPattern>;
  softDelete(id: string): Promise<CodingPattern>;
}
