export interface TopicAllocation {
  topicId: string;
  percentage: number;
}

export interface DifficultyAllocation {
  easy: number;
  medium: number;
  hard: number;
}

export interface BlueprintSection {
  sectionId: string;
  questionCount: number;
  topicAllocations: TopicAllocation[];
  difficultyAllocation: DifficultyAllocation;
  templateTypes?: string[];
}

export interface ExamBlueprint {
  configId: string;
  styleProfileId: string;
  sections: BlueprintSection[];
}

export interface CreateBlueprint {
  configId: string;
  styleProfileId: string;
  sections: BlueprintSection[];
}

export interface UpdateBlueprint {
  styleProfileId?: string;
  sections?: BlueprintSection[];
}
