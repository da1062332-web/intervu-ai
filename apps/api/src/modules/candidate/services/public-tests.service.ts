import { Injectable } from "@nestjs/common";
import { PublicTestsRepository } from "../repositories/public-tests.repository";
import { PublicTestsQueryDto } from "../dto/public-tests-query.dto";

@Injectable()
export class PublicTestsService {
  constructor(private readonly publicTestsRepository: PublicTestsRepository) {}

  async getPublicTests(query: PublicTestsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const result = await this.publicTestsRepository.findPublicTests({
      company: query.company,
      difficulty: query.difficulty,
      status: query.status,
      search: query.search,
      skip,
      take: limit,
      sortBy: query.sortBy === 'displayName' ? 'name' : (query.sortBy || "name"),
      sortOrder: query.sortOrder || "asc",
    });

    const totalPages = Math.ceil(result.total / limit);

    return {
      tests: result.items.map((t: any) => ({
        configId: t.id,
        name: t.isExam ? t.name : t.displayName,
        company: t.isExam ? "Intervu" : (t.companyName || "Unknown Company"),
        duration: t.isExam ? t.durationMinutes * 60 : t.totalDurationSeconds,
        sections: t.isExam 
          ? t.sections?.map((s: any) => s.name) || [] 
          : t.sections?.map((s: any) => s.displayName) || [],
      })),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  }
}
