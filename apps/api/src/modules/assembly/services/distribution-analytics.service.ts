import { Injectable } from "@nestjs/common";
import { AssemblyAnalyticsDto } from "@intervu/shared";
import { AssembledTestRepository } from "../repositories/assembled-test.repository";
import { AssemblyRepository } from "../repositories/assembly.repository";
import { NotFoundException } from "@nestjs/common";

type SectionWithQuestions = any; // Loosening type to support both TestInstance and AssembledTest sections

@Injectable()
export class DistributionAnalyticsService {
  constructor(
    private readonly repository: AssembledTestRepository,
    private readonly testInstanceRepository: AssemblyRepository,
  ) {}

  calculateTopicDistribution(
    sections: SectionWithQuestions[],
  ): Record<string, number> {
    const topicDist: Record<string, number> = {};
    sections.forEach((s) => {
      s.questions?.forEach((q: any) => {
        const snapshot = q.questionSnapshot as Record<string, unknown>;
        const topic = (snapshot?.conceptKey as string) || "Unknown";
        topicDist[topic] = (topicDist[topic] || 0) + 1;
      });
    });
    return topicDist;
  }

  calculateDifficultyDistribution(
    sections: SectionWithQuestions[],
  ): Record<string, number> {
    const diffDist: Record<string, number> = {};
    sections.forEach((s) => {
      s.questions?.forEach((q: any) => {
        const snapshot = q.questionSnapshot as Record<string, unknown>;
        const diff = (snapshot?.difficultyLevel as string) || "MEDIUM";
        diffDist[diff] = (diffDist[diff] || 0) + 1;
      });
    });
    return diffDist;
  }

  calculateSectionDistribution(
    sections: SectionWithQuestions[],
  ): Record<string, number> {
    const secDist: Record<string, number> = {};
    sections.forEach((s) => {
      secDist[s.sectionName || s.sectionKey] = s.questions?.length || 0;
    });
    return secDist;
  }

  calculateCoverage(sections: SectionWithQuestions[]): Record<string, number> {
    const targetTotal = sections.reduce(
      (acc, s) => acc + (s.questionCount || 0),
      0,
    );
    const actualTotal = sections.reduce(
      (acc, s) => acc + (s.questions?.length || 0),
      0,
    );
    const overallCoverage =
      targetTotal > 0 ? Math.round((actualTotal / targetTotal) * 100) : 0;
    return { overallCoverage };
  }

  calculateHealthScore(sections: SectionWithQuestions[]): number {
    return sections.length > 0 ? 100 : 0;
  }

  async buildAnalytics(assemblyId: string): Promise<AssemblyAnalyticsDto> {
    let assembly: any = null;
    try {
      assembly = await this.repository.findById(assemblyId);
    } catch {
      console.warn(
        `AssembledTest lookup failed for ${assemblyId}, falling back to TestInstance`,
      );
    }

    if (!assembly) {
      assembly = await this.testInstanceRepository.findById(assemblyId);
    }
    if (!assembly) {
      throw new NotFoundException(
        `Assembly or TestInstance ${assemblyId} not found`,
      );
    }

    const topicDistribution = this.calculateTopicDistribution(
      assembly.sections,
    );
    const difficultyDistribution = this.calculateDifficultyDistribution(
      assembly.sections,
    );
    const sectionDistribution = this.calculateSectionDistribution(
      assembly.sections,
    );
    const coverageDistribution = this.calculateCoverage(assembly.sections);
    const overallHealthScore = this.calculateHealthScore(assembly.sections);

    return {
      topicDistribution,
      difficultyDistribution,
      sectionDistribution,
      coverageDistribution,
      overallHealthScore,
    };
  }
}
