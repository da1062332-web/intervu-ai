import { Injectable, NotFoundException } from "@nestjs/common";
import { Template } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { IQuestionGenerationStrategy } from "../../interfaces/generation-strategy.interface";
import {
  GenerationContext,
  HybridPayload,
} from "../../interfaces/generation-context.interface";

/**
 * HybridGenerationStrategy
 *
 * Implements IQuestionGenerationStrategy for the HYBRID strategy.
 * Reads template.hybridConfig to load a Scenario and build
 * a relationship graph for logical reasoning questions.
 */
@Injectable()
export class HybridGenerationStrategy implements IQuestionGenerationStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async generate(template: Template): Promise<GenerationContext> {
    const config = (template.hybridConfig as Record<string, unknown>) ?? {};
    const scenarioId = config.scenarioId as string | undefined;

    // Resolve scenario — use configured scenarioId or pick first available
    const scenario = scenarioId
      ? await this.prisma.scenario.findUnique({ where: { id: scenarioId } })
      : await this.prisma.scenario.findFirst();

    if (!scenario) {
      throw new NotFoundException(
        scenarioId
          ? `Scenario "${scenarioId}" not found`
          : "No scenarios available. Create a scenario first.",
      );
    }

    const entitySchema =
      (scenario.entitySchema as Record<string, unknown>) ?? {};
    const relationSchema =
      (scenario.relationSchema as Record<string, unknown>) ?? {};
    const rules = (scenario.rules as Record<string, unknown>) ?? {};

    // Build a concrete relationship graph from schemas
    const relationshipGraph = this.buildRelationshipGraph(
      entitySchema,
      relationSchema,
      config,
    );

    const payload: HybridPayload = {
      relationshipGraph,
      scenario: {
        scenarioId: scenario.id,
        entitySchema,
        relationSchema,
      },
    };

    return {
      strategy: "HYBRID",
      payload,
      metadata: {
        templateId: template.id,
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        entityCount: Object.keys(entitySchema).length,
        generatedAt: new Date().toISOString(),
        rules,
      },
    };
  }

  private buildRelationshipGraph(
    entitySchema: Record<string, unknown>,
    relationSchema: Record<string, unknown>,
    config: Record<string, unknown>,
  ): Record<string, unknown> {
    const constraintSchema =
      (config.constraintSchema as Record<string, unknown>) ?? {};

    // Build a concrete graph: resolve entity instances from naming pools
    const namePool = (entitySchema.names as string[]) ?? [
      "A",
      "B",
      "C",
      "D",
      "E",
    ];
    const validRelations = (relationSchema.relations as string[]) ?? [
      "knows",
      "is parent of",
    ];
    const entityCount = Math.min(
      (constraintSchema.entityCount as number) ?? 4,
      namePool.length,
    );

    // Pick random entity names
    const shuffled = [...namePool].sort(() => Math.random() - 0.5);
    const entities = shuffled.slice(0, entityCount);

    // Generate random relation edges (avoiding self-loops)
    const edges: Array<{ from: string; relation: string; to: string }> = [];
    for (let i = 0; i < entities.length - 1; i++) {
      const relation =
        validRelations[Math.floor(Math.random() * validRelations.length)];
      edges.push({ from: entities[i], relation, to: entities[i + 1] });
    }

    return { entities, edges };
  }
}
