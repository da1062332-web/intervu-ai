import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { ParameterGeneratorService } from "../services/parameter-generator.service";
import { DatasetLoaderService } from "../services/dataset-loader.service";
import { EntityGeneratorService } from "../services/entity-generator.service";
import { GenerationStrategyResolver } from "../services/generation-strategy.resolver";
import { NotFoundException } from "@nestjs/common";

describe("SGE Backend Pipeline", () => {
  let resolver: GenerationStrategyResolver;
  let datasetLoader: DatasetLoaderService;
  let entityGenerator: EntityGeneratorService;
  let prisma: PrismaService;

  const mockPrisma = {
    template: {
      findUnique: jest.fn(),
    },
    dataset: {
      findFirst: jest.fn(),
    },
    datasetItem: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerationStrategyResolver,
        ParameterGeneratorService,
        DatasetLoaderService,
        EntityGeneratorService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    resolver = module.get<GenerationStrategyResolver>(GenerationStrategyResolver);
    datasetLoader = module.get<DatasetLoaderService>(DatasetLoaderService);
    entityGenerator = module.get<EntityGeneratorService>(EntityGeneratorService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe("DatasetLoaderService", () => {
    it("should query dataset items based on tags, topic, and difficulty", async () => {
      mockPrisma.dataset.findFirst.mockResolvedValue({ id: "ds-1", name: "Vocabulary" });
      mockPrisma.datasetItem.findMany.mockResolvedValue([
        { id: "item-1", content: "benevolent", difficulty: "MEDIUM", topic: "synonyms", tags: ["english"], metadata: { synonym: "kind" } },
      ]);

      const template = {
        difficultyLevel: "MEDIUM",
        conceptKey: "synonyms",
        datasetConfig: {
          datasetName: "Vocabulary",
          filters: { tags: ["english"] },
        },
      };

      const result = await datasetLoader.loadDatasetItem(template as any);
      expect(result.content).toBe("benevolent");
      expect(result.metadata.synonym).toBe("kind");
    });
  });

  describe("EntityGeneratorService (Hybrid)", () => {
    it("should generate a cycle-free directed relationship graph", () => {
      const template = {
        hybridConfig: {
          entitySchema: { names: ["Rohan", "Amit", "Neha"] },
          relationSchema: { relations: ["father", "brother"] },
        },
      };

      const result = entityGenerator.generateGraph(template as any);
      expect(result.entities).toContain("Rohan");
      expect(result.relations.length).toBeGreaterThanOrEqual(2);
      expect(result.relations[0].type).toBeDefined();
    });
  });

  describe("GenerationStrategyResolver", () => {
    it("should dispatch to VARIABLE strategy parameter generator", async () => {
      mockPrisma.template.findUnique.mockResolvedValue({
        id: "tpl-1",
        conceptKey: "math",
        generationStrategy: "VARIABLE",
        variableSchema: {
          variables: [{ name: "price", type: "number", min: 10, max: 20 }],
        },
        constraints: {},
      });

      const result = await resolver.resolve("tpl-1");
      expect(result.generationStrategy).toBe("VARIABLE");
      expect(result.variables.price).toBeGreaterThanOrEqual(10);
      expect(result.variables.price).toBeLessThanOrEqual(20);
    });

    it("should dispatch to DATASET strategy loader", async () => {
      mockPrisma.template.findUnique.mockResolvedValue({
        id: "tpl-2",
        conceptKey: "synonyms",
        generationStrategy: "DATASET",
        difficultyLevel: "MEDIUM",
        datasetConfig: { datasetName: "Vocabulary" },
      });

      mockPrisma.dataset.findFirst.mockResolvedValue({ id: "ds-2", name: "Vocabulary" });
      mockPrisma.datasetItem.findMany.mockResolvedValue([
        { id: "item-2", content: "covert", difficulty: "HARD", topic: "synonyms", tags: [], metadata: { synonym: "secret" } },
      ]);

      const result = await resolver.resolve("tpl-2");
      expect(result.generationStrategy).toBe("DATASET");
      expect(result.datasetItem?.content).toBe("covert");
    });

    it("should dispatch to HYBRID strategy relationship graph builder", async () => {
      mockPrisma.template.findUnique.mockResolvedValue({
        id: "tpl-3",
        conceptKey: "blood_relations",
        generationStrategy: "HYBRID",
        hybridConfig: {
          entitySchema: { names: ["Rohan", "Amit"] },
        },
      });

      const result = await resolver.resolve("tpl-3");
      expect(result.generationStrategy).toBe("HYBRID");
      expect(result.logicalGraph?.entities).toContain("Rohan");
    });
  });
});
