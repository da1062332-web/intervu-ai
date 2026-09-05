import { Injectable } from "@nestjs/common";
import { PublicTestsRepository } from "../repositories/public-tests.repository";
import { PublicTestsQueryDto } from "../dto/public-tests-query.dto";
import { EntitlementService } from "../../billing/services/entitlement.service";

interface CachedPublicTests {
  data: any;
  expiresAt: number;
}

const publicTestsMemCache = new Map<string, CachedPublicTests>();
const inFlightPublicTests = new Map<string, Promise<any>>();

@Injectable()
export class PublicTestsService {
  constructor(
    private readonly publicTestsRepository: PublicTestsRepository,
    private readonly entitlementService: EntitlementService,
  ) {}

  async getPublicTests(userId: string, query: PublicTestsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `${userId}:${page}:${limit}:${query.search || ''}:${query.difficulty || ''}:${query.status || ''}:${query.sortBy || ''}:${query.sortOrder || ''}`;
    const cached = publicTestsMemCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const existingPromise = inFlightPublicTests.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const requestPromise = this.computePublicTests(userId, query, page, limit, skip)
      .then((data) => {
        publicTestsMemCache.set(cacheKey, {
          data,
          expiresAt: Date.now() + 30_000, // 30s cache
        });
        inFlightPublicTests.delete(cacheKey);
        return data;
      })
      .catch((err) => {
        inFlightPublicTests.delete(cacheKey);
        throw err;
      });

    inFlightPublicTests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  private async computePublicTests(
    userId: string,
    query: PublicTestsQueryDto,
    page: number,
    limit: number,
    skip: number,
  ) {
    // Run entitlements and public tests queries in parallel
    const [entitlements, result] = await Promise.all([
      this.entitlementService.getUserEntitlements(userId).catch(() => null),
      this.publicTestsRepository.findPublicTests({
        userId,
        company: query.company,
        difficulty: query.difficulty,
        status: query.status,
        search: query.search,
        skip,
        take: limit,
        sortBy: query.sortBy === "displayName" ? "name" : query.sortBy || "name",
        sortOrder: query.sortOrder || "asc",
      }),
    ]);

    const features = (entitlements?.features as any) || {};
    const allowedAssessmentsVal = features.allowedAssessments || features.allowed_assessments;
    let allowedList: string[] | null = null;
    let attemptsPerExamOverride: number | null = null;

    if (allowedAssessmentsVal) {
      if (typeof allowedAssessmentsVal === "object" && !Array.isArray(allowedAssessmentsVal)) {
        if (Array.isArray(allowedAssessmentsVal.assessments)) {
          allowedList = allowedAssessmentsVal.assessments;
        }
        if (typeof allowedAssessmentsVal.attemptsPerExam === "number") {
          attemptsPerExamOverride = allowedAssessmentsVal.attemptsPerExam;
        }
      } else if (Array.isArray(allowedAssessmentsVal)) {
        allowedList = allowedAssessmentsVal;
      }
    }

    const isVip = entitlements?.plan === 'VIP_UNLIMITED' || entitlements?.planSlug === 'vip-unlimited';
    if (isVip) {
      allowedList = ['all'];
    }

    const hasActivePlan = Boolean(entitlements?.hasActivePlan);

    const filteredItems = result.items.filter((t: any) => {
      if (!allowedList || allowedList.includes("all")) return true;
      return (
        allowedList.includes(t.id) ||
        (t.code && allowedList.includes(t.code)) ||
        (t.name && allowedList.includes(t.name))
      );
    });

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / limit));


    return {
      tests: filteredItems.map((t: any) => {
        const sumSectionQuestions =
          t.sections?.reduce(
            (sum: number, s: any) => sum + (s.questionCount || 0),
            0,
          ) || 0;

        const sumSectionMinutes =
          t.sections?.reduce(
            (sum: number, s: any) =>
              sum +
              (s.sectionDurationMinutes ||
                (s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0) ||
                0),
            0,
          ) || 0;

        const questionCount =
          sumSectionQuestions > 0 ? sumSectionQuestions : t.totalQuestions || 0;

        const durationMinutes =
          sumSectionMinutes > 0
            ? sumSectionMinutes
            : t.durationMinutes ||
              (t.totalDurationSeconds
                ? Math.floor(t.totalDurationSeconds / 60)
                : 0);

        const durationSeconds = durationMinutes * 60;

        const mappedSections =
          t.sections?.map((s: any) => ({
            name: t.isExam ? s.name : s.displayName,
            displayName: t.isExam ? s.name : s.displayName,
            questionCount: s.questionCount || 0,
            durationMinutes:
              s.sectionDurationMinutes ||
              (s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0),
          })) || [];

        const maxAttempts =
          isVip
            ? null
            : (attemptsPerExamOverride ??
              ((t.ruleFlags && typeof t.ruleFlags === "object" && "maxAttempts" in t.ruleFlags)
                ? Number((t.ruleFlags as any).maxAttempts)
                : 3));
        const attemptCount = t.testInstances ? t.testInstances.length : 0;
        const canReattempt = isVip || (maxAttempts ? attemptCount < maxAttempts : true);

        return {
          configId: t.id,
          name: t.isExam ? t.name : t.displayName,
          company: t.isExam ? "SkillitriX" : t.companyName || "Unknown Company",
          duration: durationSeconds,
          durationMinutes,
          questionCount,
          sections: mappedSections,
          difficulty: t.difficulty || "Medium",
          description: t.description || null,
          maxAttempts,
          attemptCount,
          canReattempt,
          isLocked: false,
        };
      }),
      pagination: {
        page,
        limit,
        total: filteredItems.length,
        totalPages,
      },
    };
  }
}
