import { Prisma } from "@prisma/client";

// Define the full configuration graph type to prevent N+1 queries during publishing
export type FullExamConfig = Prisma.ExamConfigGetPayload<{
  include: {
    sections: {
      include: {
        sectionTopics: {
          include: {
            topic: {
              include: {
                concepts: true;
              };
            };
            topicWeightage: true;
          };
        };
      };
    };
    difficultyDistribution: true;
    ruleFlags: true;
  };
}>;
