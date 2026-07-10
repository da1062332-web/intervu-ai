import { Injectable, NotFoundException } from "@nestjs/common";
import { GenerationStrategy } from "@prisma/client";
import { IQuestionGenerationStrategy } from "../interfaces/generation-strategy.interface";

/**
 * StrategyRegistry
 *
 * Holds a Map<GenerationStrategy, IQuestionGenerationStrategy>.
 * The resolver asks the registry — no if/switch anywhere in the resolver.
 * New strategies can be added by registering them in onModuleInit, with zero
 * changes to any existing service.
 */
@Injectable()
export class StrategyRegistry {
  private readonly strategies = new Map<
    GenerationStrategy,
    IQuestionGenerationStrategy
  >();

  register(
    key: GenerationStrategy,
    strategy: IQuestionGenerationStrategy,
  ): void {
    this.strategies.set(key, strategy);
  }

  resolve(key: GenerationStrategy): IQuestionGenerationStrategy {
    const strategy = this.strategies.get(key);
    if (!strategy) {
      throw new NotFoundException(
        `No generation strategy registered for: ${key}`,
      );
    }
    return strategy;
  }

  hasStrategy(key: GenerationStrategy): boolean {
    return this.strategies.has(key);
  }
}
