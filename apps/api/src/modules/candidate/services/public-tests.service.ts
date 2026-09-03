import { Injectable } from "@nestjs/common";
import { PublicTestsRepository } from "../repositories/public-tests.repository";
import { PublicTestsQueryDto } from "../dto/public-tests-query.dto";
import { EntitlementService } from "../../billing/services/entitlement.service";

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

    // 1. Fetch user entitlements from active subscription plan
    let entitlements = null;
    try {
      entitlements = await this.entitlementService.getUserEntitlements(userId);
    } catch {}

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

    const hasActivePlan = Boolean(entitlements?.hasActivePlan);
    if (!hasActivePlan) {
      return {
        tests: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1,
        },
      };
    }

    const result = await this.publicTestsRepository.findPublicTests({
      userId,
      company: query.company,
      difficulty: query.difficulty,
      status: query.status,
      search: query.search,
      skip,
      take: limit,
      sortBy: query.sortBy === "displayName" ? "name" : query.sortBy || "name",
      sortOrder: query.sortOrder || "asc",
    });

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
          attemptsPerExamOverride ??
          ((t.ruleFlags && typeof t.ruleFlags === "object" && "maxAttempts" in t.ruleFlags)
            ? Number((t.ruleFlags as any).maxAttempts)
            : 3);
        const attemptCount = t.testInstances ? t.testInstances.length : 0;
        const canReattempt = attemptCount < maxAttempts;

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
