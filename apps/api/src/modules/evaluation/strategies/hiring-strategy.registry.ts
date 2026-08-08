import { Injectable, NotFoundException } from "@nestjs/common";
import { IHiringEvaluationStrategy } from "./hiring-evaluation-strategy.interface";
import { TcsHiringStrategy } from "./tcs-hiring.strategy";

@Injectable()
export class HiringStrategyRegistry {
  private readonly strategies = new Map<string, IHiringEvaluationStrategy>();

  constructor(private readonly tcsStrategy: TcsHiringStrategy) {
    this.registerStrategy(tcsStrategy);
  }

  registerStrategy(strategy: IHiringEvaluationStrategy): void {
    if (strategy && strategy.strategyType) {
      this.strategies.set(strategy.strategyType.toUpperCase(), strategy);
    }
  }

  getStrategy(strategyType: string): IHiringEvaluationStrategy {
    const strategy = this.strategies.get(strategyType.toUpperCase());
    if (!strategy) {
      // Default to TCS if strategy is unknown or fallback
      const defaultStrategy = this.strategies.get("TCS");
      if (defaultStrategy) return defaultStrategy;
      throw new NotFoundException(
        `Hiring evaluation strategy '${strategyType}' not found`,
      );
    }
    return strategy;
  }
}
