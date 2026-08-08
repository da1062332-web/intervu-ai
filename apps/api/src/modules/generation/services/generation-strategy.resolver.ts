import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ParameterGeneratorService } from "./parameter-generator.service";
import { DatasetLoaderService } from "./dataset-loader.service";
import { EntityGeneratorService } from "./entity-generator.service";

export interface StrategyResolvedContext {
  templateId: string;
  conceptKey: string;
  generationStrategy: string;
  variables: Record<string, any>;
  datasetItem?: {
    id?: string;
    content: string;
    metadata: any;
  };
  logicalGraph?: {
    entities: string[];
    relations: any[];
  };
}

@Injectable()
export class GenerationStrategyResolver {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paramGenerator: ParameterGeneratorService,
    private readonly datasetLoader: DatasetLoaderService,
    private readonly entityGenerator: EntityGeneratorService,
  ) {}

  /**
   * Resolves a template, executes its generation strategy pipeline,
   * and returns a standardized Generation Context.
   */
  async resolve(templateId: string): Promise<StrategyResolvedContext> {
    // 1. Fetch template from DB
    const template = await this.prismaService.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID "${templateId}" not found`);
    }

    const strategy = template.generationStrategy || "VARIABLE";

    // 2. Dispatch to the correct pipeline
    switch (strategy.toUpperCase()) {
      case "VARIABLE": {
        // VARIABLE: Runs Parameter & Formula evaluation
        const variables = this.paramGenerator.generateParameters(
          template as any,
        );
        return {
          templateId: template.id,
          conceptKey: template.conceptKey,
          generationStrategy: "VARIABLE",
          variables,
        };
      }
      case "DATASET": {
        // DATASET: Loads content passage/vocabulary
        const datasetItem = await this.datasetLoader.loadDatasetItem(
          template as any,
        );

        const variables: Record<string, any> = {};
        const config =
          await this.prismaService.templateDatasetConfig.findUnique({
            where: { templateId: template.id },
          });

        if (config && config.variableMapping) {
          const mapping =
            (config.variableMapping as Record<string, string>) || {};
          const metadata = datasetItem.metadata || {};

          const templateVars =
            await this.prismaService.templateVariable.findMany({
              where: { templateId: template.id },
            });

          const getMappedValue = (field: string) => {
            if (!field) return undefined;
            if (field === "content") return datasetItem.content;
            if (field === "id") return datasetItem.id;
            return metadata[field];
          };

          // First try to load from explicitly defined template variables
          for (const tVar of templateVars) {
            const mappedField = mapping[tVar.variableName];
            let val = mappedField ? getMappedValue(mappedField) : undefined;
            if (val === undefined || val === null) {
              val = tVar.defaultValue || "";
            }
            variables[tVar.variableName] = val;
          }

          // Fallback: If variable mapping exists but templateVars wasn't populated,
          // inject mapped values directly.
          for (const [varName, mappedField] of Object.entries(mapping)) {
            if (variables[varName] === undefined) {
              variables[varName] = getMappedValue(mappedField as string) || "";
            }
          }
        }

        return {
          templateId: template.id,
          conceptKey: template.conceptKey,
          generationStrategy: "DATASET",
          variables,
          datasetItem,
        };
      }
      case "HYBRID": {
        // HYBRID: Generates relationship entities graph
        const logicalGraph = this.entityGenerator.generateGraph(
          template as any,
        );
        return {
          templateId: template.id,
          conceptKey: template.conceptKey,
          generationStrategy: "HYBRID",
          variables: {},
          logicalGraph,
        };
      }
      default:
        throw new BadRequestException(
          `Unsupported generation strategy: ${strategy}`,
        );
    }
  }
}

import { BadRequestException } from "@nestjs/common";
