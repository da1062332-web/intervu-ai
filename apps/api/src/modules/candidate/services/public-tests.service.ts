import { Injectable } from "@nestjs/common";
import { PublicTestsRepository } from "../repositories/public-tests.repository";
import { PublicTestsQueryDto } from "../dto/public-tests-query.dto";

@Injectable()
export class PublicTestsService {
  constructor(private readonly publicTestsRepository: PublicTestsRepository) {}

  async getPublicTests(userId: string, query: PublicTestsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const result = await this.publicTestsRepository.findPublicTests({
      userId,
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
      tests: result.items.map((t: any) => {
        const sumSectionQuestions = t.sections?.reduce(
          (sum: number, s: any) => sum + (s.questionCount || 0),
          0,
        ) || 0;

        const sumSectionMinutes = t.sections?.reduce(
          (sum: number, s: any) =>
            sum +
            (s.sectionDurationMinutes || (s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0) || 0),
          0,
        ) || 0;

        const questionCount = sumSectionQuestions > 0 ? sumSectionQuestions : (t.totalQuestions || 0);

        const durationMinutes = sumSectionMinutes > 0
          ? sumSectionMinutes
          : t.durationMinutes || (t.totalDurationSeconds ? Math.floor(t.totalDurationSeconds / 60) : 0);

        const durationSeconds = durationMinutes * 60;

        const mappedSections = t.sections?.map((s: any) => ({
          name: t.isExam ? s.name : s.displayName,
          displayName: t.isExam ? s.name : s.displayName,
          questionCount: s.questionCount || 0,
          durationMinutes: s.sectionDurationMinutes || (s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0),
        })) || [];

        return {
          configId: t.id,
          name: t.isExam ? t.name : t.displayName,
          company: t.isExam ? "Intervu" : (t.companyName || "Unknown Company"),
          duration: durationSeconds,
          durationMinutes,
          questionCount,
          sections: mappedSections,
          difficulty: t.difficulty || "Medium",
          description: t.description || null,
        };
      }),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
      },
    };
  }
}
