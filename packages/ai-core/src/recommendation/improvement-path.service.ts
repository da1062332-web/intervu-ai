import { RecommendationDto } from "@intervu-ai/contracts";

export class ImprovementPathService {
  private readonly priorityWeight = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  /**
   * Sorts recommendations by priority: HIGH -> MEDIUM -> LOW.
   * If priorities are equal, keeps them in alphabetical order by skill/concept name.
   */
  createPath(recommendations: RecommendationDto[]): RecommendationDto[] {
    if (!recommendations || !Array.isArray(recommendations)) {
      return [];
    }

    // Sort by priority weight desc, then skill name asc
    return [...recommendations].sort((a, b) => {
      const weightA = this.priorityWeight[a.priority] || 0;
      const weightB = this.priorityWeight[b.priority] || 0;

      if (weightA !== weightB) {
        return weightB - weightA; // Descending weight (3 -> 2 -> 1)
      }

      return a.skill.localeCompare(b.skill);
    });
  }
}
