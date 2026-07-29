import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { TopicService } from "../src/modules/concept-mapping/services/topic.service";
import { ConceptMappingService } from "../src/modules/concept-mapping/services/concept-mapping.service";

interface TopicDefinition {
  name: string;
  code: string;
  description: string;
}

interface ConceptDefinition {
  name: string;
  code: string;
  description: string;
}

const topics: TopicDefinition[] = [
  {
    name: "LCM & HCF",
    code: "LCM_HCF",
    description:
      "Questions related to Least Common Multiple (LCM), Highest Common Factor (HCF), simplification and reciprocal-based numerical aptitude concepts.",
  },
  {
    name: "Algebra",
    code: "ALGEBRA",
    description:
      "Questions covering algebraic equations, reciprocal equations and mathematical relationships.",
  },
  {
    name: "Percentages",
    code: "PERCENTAGES",
    description:
      "Questions involving percentages, successive percentage changes, revenue, profit and related numerical applications.",
  },
  {
    name: "Simple & Compound Interest",
    code: "SI_CI",
    description:
      "Questions covering Simple Interest, Compound Interest and interest-based numerical aptitude problems.",
  },
  {
    name: "Averages",
    code: "AVERAGES",
    description:
      "Questions based on averages, weighted averages and age-related average concepts.",
  },
  {
    name: "Ratio",
    code: "RATIO",
    description:
      "Questions involving ratios, mixtures and proportional reasoning.",
  },
  {
    name: "Profit & Loss",
    code: "PROFIT_LOSS",
    description:
      "Questions related to profit, loss, discount and marked price.",
  },
  {
    name: "Time & Work",
    code: "TIME_WORK",
    description:
      "Questions involving work, efficiency, pipes and collaborative work problems.",
  },
  {
    name: "Time, Speed & Distance",
    code: "TSD",
    description:
      "Questions related to speed, distance, trains, boats and relative motion.",
  },
  {
    name: "Ratio and Proportion",
    code: "RATIO_AND_PROPORTION",
    description:
      "Questions covering ratio, proportional reasoning and comparison-based numerical problems.",
  },
  {
    name: "Mensuration",
    code: "MENSURATION",
    description:
      "Questions involving mensuration formulas and geometric measurements.",
  },
  {
    name: "Area",
    code: "AREA",
    description:
      "Questions related to area and surface area calculations.",
  },
  {
    name: "Ages",
    code: "AGES",
    description:
      "Questions involving age-based equations and relationships.",
  },
  {
    name: "Probability",
    code: "PROBABILITY",
    description:
      "Questions covering probability and probability-based equations.",
  },
];

const conceptsByTopicCode: Record<string, ConceptDefinition[]> = {
  LCM_HCF: [
    {
      name: "FractionLCM/HCF",
      code: "FRACTION_LCM_HCF",
      description: "Fraction problems involving LCM and HCF.",
    },
    {
      name: "LCM/HCFBasics",
      code: "LCM_HCF_BASICS",
      description: "Basic LCM and HCF calculation problems.",
    },
    {
      name: "HCF-LCMRelation",
      code: "HCF_LCM_RELATION",
      description: "Problems based on the relationship between HCF and LCM.",
    },
    {
      name: "SimplificationReciprocal",
      code: "SIMPLIFICATION_RECIPROCAL",
      description: "Simplification and reciprocal-based numerical problems.",
    },
  ],
  ALGEBRA: [
    {
      name: "ReciprocalEquation",
      code: "RECIPROCAL_EQUATION",
      description: "Reciprocal equation problems.",
    },
    {
      name: "Sum&Reciprocal",
      code: "SUM_RECIPROCAL",
      description: "Sum and reciprocal-based algebraic relationships.",
    },
  ],
  PERCENTAGES: [
    {
      name: "Percentage&Reciprocal",
      code: "PERCENTAGE_RECIPROCAL",
      description: "Percentage and reciprocal problems.",
    },
    {
      name: "PercentageCounting",
      code: "PERCENTAGE_COUNTING",
      description: "Percentage counting and comparison problems.",
    },
    {
      name: "VolumeChange",
      code: "VOLUME_CHANGE",
      description: "Successive percentage change problems involving volume.",
    },
    {
      name: "WeightedProfit",
      code: "WEIGHTED_PROFIT",
      description: "Weighted profit and percentage-based profit problems.",
    },
    {
      name: "SuccessivePercentage",
      code: "SUCCESSIVE_PERCENTAGE",
      description: "Successive percentage change calculations.",
    },
    {
      name: "Speed-Time",
      code: "SPEED_TIME",
      description: "Speed and time related percentage problems.",
    },
    {
      name: "WeightedPercentage",
      code: "WEIGHTED_PERCENTAGE",
      description: "Weighted percentage problems.",
    },
    {
      name: "Work&Pipes",
      code: "WORK_PIPES",
      description: "Work and pipes problems with percentage context.",
    },
    {
      name: "Profit-LossOverall",
      code: "PROFIT_LOSS_OVERALL",
      description: "Overall profit and loss problems using percentage methods.",
    },
    {
      name: "RevenueChange",
      code: "REVENUE_CHANGE",
      description: "Revenue change calculations and percentage effects.",
    },
    {
      name: "PercentageCalculation",
      code: "PERCENTAGE_CALCULATION",
      description: "General percentage calculation problems.",
    },
    {
      name: "MarkedPrice",
      code: "MARKED_PRICE",
      description: "Marked price, discount and percentage problems.",
    },
    {
      name: "Inclusion-Exclusion",
      code: "INCLUSION_EXCLUSION",
      description: "Inclusion-exclusion problems in percentage settings.",
    },
  ],
  SI_CI: [
    {
      name: "CompoundInterest",
      code: "COMPOUND_INTEREST",
      description: "Compound interest calculations.",
    },
    {
      name: "Time&CI",
      code: "TIME_CI",
      description: "Time and compound interest relationship problems.",
    },
    {
      name: "WeightedAverageRate",
      code: "WEIGHTED_AVERAGE_RATE",
      description: "Weighted average rate problems in interest calculations.",
    },
    {
      name: "CIFractionalTime",
      code: "CI_FRACTIONAL_TIME",
      description: "Compound interest with fractional time periods.",
    },
    {
      name: "CIYearlyInterest",
      code: "CI_YEARLY_INTEREST",
      description: "Yearly compound interest problems.",
    },
    {
      name: "Installment(CI)",
      code: "INSTALLMENT_CI",
      description: "Installment and compound interest problems.",
    },
  ],
  AVERAGES: [
    {
      name: "WeightedAverage",
      code: "WEIGHTED_AVERAGE",
      description: "Weighted average problems.",
    },
    {
      name: "ReplacementAverage",
      code: "REPLACEMENT_AVERAGE",
      description: "Replacement average problems.",
    },
    {
      name: "AgeEquations",
      code: "AGE_EQUATIONS",
      description: "Age equation problems.",
    },
    {
      name: "RatioAverage",
      code: "RATIO_AVERAGE",
      description: "Ratio-based average problems.",
    },
    {
      name: "LinearRelation",
      code: "LINEAR_RELATION",
      description: "Linear relation problems in averages.",
    },
    {
      name: "AgeRelation",
      code: "AGE_RELATION",
      description: "Age relation problems.",
    },
    {
      name: "AverageSum",
      code: "AVERAGE_SUM",
      description: "Problems involving average sums.",
    },
    {
      name: "WeightedRatio",
      code: "WEIGHTED_RATIO",
      description: "Weighted ratio problems.",
    },
    {
      name: "NetAverageChange",
      code: "NET_AVERAGE_CHANGE",
      description: "Net average change problems.",
    },
  ],
  RATIO: [
    {
      name: "MixtureRatio",
      code: "MIXTURE_RATIO",
      description: "Mixture and ratio problems.",
    },
    {
      name: "RatioChange",
      code: "RATIO_CHANGE",
      description: "Ratio change problems.",
    },
    {
      name: "RatioAdjustment",
      code: "RATIO_ADJUSTMENT",
      description: "Ratio adjustment calculations.",
    },
    {
      name: "RatioPercentage",
      code: "RATIO_PERCENTAGE",
      description: "Ratio and percentage problems.",
    },
    {
      name: "IncomeRatio",
      code: "INCOME_RATIO",
      description: "Income ratio problems.",
    },
    {
      name: "SpeedRatio",
      code: "SPEED_RATIO",
      description: "Speed ratio problems.",
    },
    {
      name: "AgeRatio",
      code: "AGE_RATIO",
      description: "Age ratio problems.",
    },
    {
      name: "Mixture&Profit",
      code: "MIXTURE_PROFIT",
      description: "Mixture and profit ratio problems.",
    },
    {
      name: "WeightedAverage",
      code: "WEIGHTED_AVERAGE",
      description: "Weighted average problems in ratio contexts.",
    },
    {
      name: "WeightedPercentage",
      code: "WEIGHTED_PERCENTAGE",
      description: "Weighted percentage problems in ratio contexts.",
    },
    {
      name: "Boat&Stream",
      code: "BOAT_STREAM",
      description: "Boat and stream ratio problems.",
    },
    {
      name: "GeometryRatio",
      code: "GEOMETRY_RATIO",
      description: "Geometry ratio problems.",
    },
    {
      name: "RatioEquation",
      code: "RATIO_EQUATION",
      description: "Ratio equation problems.",
    },
  ],
  PROFIT_LOSS: [
    {
      name: "SuccessiveDiscount",
      code: "SUCCESSIVE_DISCOUNT",
      description: "Successive discount problems.",
    },
    {
      name: "ProfitRatio",
      code: "PROFIT_RATIO",
      description: "Profit ratio problems.",
    },
    {
      name: "WeightedProfit",
      code: "WEIGHTED_PROFIT",
      description: "Weighted profit problems.",
    },
    {
      name: "MixtureProfit",
      code: "MIXTURE_PROFIT",
      description: "Mixture profit problems.",
    },
    {
      name: "MarkedPrice",
      code: "MARKED_PRICE",
      description: "Marked price and discount problems.",
    },
    {
      name: "ProfitChange",
      code: "PROFIT_CHANGE",
      description: "Profit change and percentage problems.",
    },
  ],
  TIME_WORK: [
    {
      name: "WorkFormula",
      code: "WORK_FORMULA",
      description: "Work formula and related problems.",
    },
    {
      name: "CombinedWork",
      code: "COMBINED_WORK",
      description: "Combined work problems.",
    },
    {
      name: "WorkRate",
      code: "WORK_RATE",
      description: "Work rate problems.",
    },
    {
      name: "PipesWork",
      code: "PIPES_WORK",
      description: "Pipes work problems.",
    },
    {
      name: "Work&Efficiency",
      code: "WORK_EFFICIENCY",
      description: "Work and efficiency problems.",
    },
    {
      name: "WorkPattern",
      code: "WORK_PATTERN",
      description: "Work pattern problems.",
    },
  ],
  TSD: [
    {
      name: "RelativeSpeed",
      code: "RELATIVE_SPEED",
      description: "Relative speed problems.",
    },
    {
      name: "SpeedFormula",
      code: "SPEED_FORMULA",
      description: "Speed formula problems.",
    },
    {
      name: "TrainLength",
      code: "TRAIN_LENGTH",
      description: "Train length problems.",
    },
    {
      name: "SpeedRatio",
      code: "SPEED_RATIO",
      description: "Speed ratio problems.",
    },
    {
      name: "IncreasingSpeed",
      code: "INCREASING_SPEED",
      description: "Increasing speed problems.",
    },
    {
      name: "SpeedAdjustment",
      code: "SPEED_ADJUSTMENT",
      description: "Speed adjustment problems.",
    },
    {
      name: "RatioSpeed",
      code: "RATIO_SPEED",
      description: "Ratio speed problems.",
    },
    {
      name: "BoatEquation",
      code: "BOAT_EQUATION",
      description: "Boat equation problems.",
    },
  ],
  RATIO_AND_PROPORTION: [
    {
      name: "IncomeRatio",
      code: "INCOME_RATIO",
      description: "Income ratio problems.",
    },
    {
      name: "RatioChange",
      code: "RATIO_CHANGE",
      description: "Ratio change problems.",
    },
    {
      name: "CoinsRatio",
      code: "COINS_RATIO",
      description: "Coins ratio problems.",
    },
  ],
  MENSURATION: [
    {
      name: "HexagonFormula",
      code: "HEXAGON_FORMULA",
      description: "Hexagon formula problems.",
    },
  ],
  AREA: [
    {
      name: "CylinderSurface",
      code: "CYLINDER_SURFACE",
      description: "Cylinder surface area problems.",
    },
  ],
  AGES: [
    {
      name: "AgeSum",
      code: "AGE_SUM",
      description: "Age sum problems.",
    },
  ],
  PROBABILITY: [
    {
      name: "ProbabilityEquation",
      code: "PROBABILITY_EQUATION",
      description: "Probability equation problems.",
    },
  ],
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const topicService = app.get(TopicService);
  const conceptService = app.get(ConceptMappingService);

  let createdTopicCount = 0;
  let createdConceptCount = 0;
  const results: Array<{ topic: string; created: boolean; error?: string }> = [];

  try {
    const createdTopics = new Map<string, string>();

    for (const topic of topics) {
      try {
        const created = await topicService.createTopic({
          name: topic.name,
          code: topic.code,
          description: topic.description,
          status: "ACTIVE",
        });
        createdTopics.set(topic.code, created.id);
        createdTopicCount += 1;
        results.push({ topic: topic.code, created: true });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({ topic: topic.code, created: false, error: message });
        console.error(`Topic creation failed for ${topic.code}:`, message);
      }
    }

    for (const topic of topics) {
      const topicId = createdTopics.get(topic.code);
      if (!topicId) {
        console.warn(`Skipping concepts for ${topic.code} because the topic was not created.`);
        continue;
      }

      const concepts = conceptsByTopicCode[topic.code];
      if (!concepts) continue;

      for (const concept of concepts) {
        try {
          await conceptService.createConcept(topicId, {
            name: concept.name,
            code: concept.code,
            description: concept.description,
            status: "ACTIVE",
            conceptName: concept.name,
            conceptCode: concept.code,
          });
          createdConceptCount += 1;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          results.push({ topic: topic.code, created: false, error: message });
          console.error(`Concept creation failed for ${concept.code} under ${topic.code}:`, message);
        }
      }
    }

    console.log(`\nTopic creation results:`);
    for (const result of results) {
      if (!result.created) {
        console.log(`- ${result.topic}: FAILED (${result.error})`);
      }
    }
    console.log(`\nTotal Topics created: ${createdTopicCount}`);
    console.log(`Total Concepts created: ${createdConceptCount}`);

    console.log(`\nVerifying topic and concept linkage...`);
    for (const topic of topics) {
      const topicId = createdTopics.get(topic.code);
      if (!topicId) continue;
      const conceptList = await conceptService.getConcepts(topicId);
      console.log(`- ${topic.code}: ${conceptList.length} concepts`);
    }
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
