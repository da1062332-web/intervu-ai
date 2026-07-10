import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { StrategyRegistry } from "../registry/strategy.registry";
import { GenerationContext } from "../interfaces/generation-context.interface";

/**
 * GenerationStrategyResolver
 *
 * Fetches template → reads generationStrategy → asks StrategyRegistry for
 * the correct strategy → calls generate(template) → returns GenerationContext.
 *
 * Contains ZERO if/switch on strategy — the registry handles all dispatch.
 */
@Injectable()
export class GenerationStrategyResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly strategyRegistry: StrategyRegistry,
  ) {}

  async resolve(templateId: string): Promise<GenerationContext> {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template "${templateId}" not found.`);
    }

    if (!template.isActive) {
      throw new NotFoundException(
        `Template "${templateId}" is not active and cannot be used for generation.`,
      );
    }

    // Delegate to the strategy — no if/switch here
    const strategy = this.strategyRegistry.resolve(template.generationStrategy);
    return strategy.generate(template);
  }
}
