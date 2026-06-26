import { Injectable } from "@nestjs/common";
import { BlueprintDto } from "@intervu/shared";

export interface SimulationDto {
  totalQuestions: number;
  sections: {
    sectionKey: string;
    questionCount: number;
    estimatedDuration: number;
  }[];
  estimatedDifficulty: string; // "EASY", "MEDIUM", "HARD"
}

@Injectable()
export class BlueprintSimulationService {
  simulate(blueprint: BlueprintDto): SimulationDto {
    let totalQuestions = 0;
    const sections = [];
    for (const section of blueprint.sections) {
      const qCount = section.questionCount || 0;
      totalQuestions += qCount;

      const duration = section.durationSeconds || 0;

      sections.push({
        sectionKey: section.sectionKey || `section-${sections.length + 1}`,
        questionCount: qCount,
        estimatedDuration: duration,
      });

      // Rough difficulty estimation based on blueprint topics if they had weights
      // Here we just mock it, since true logic requires reading question pools.
      // But we can approximate based on some config if available, else default.
    }

    // Defaulting difficulty logic for now.
    const estimatedDifficulty = "MEDIUM";

    return {
      totalQuestions,
      sections,
      estimatedDifficulty,
    };
  }
}
