import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

/**
 * 79. DP_COIN_CHANGE_ORACLE
 */
@Injectable()
export class DpCoinChangeOracle extends BaseOracle {
  readonly key = "DP_COIN_CHANGE_ORACLE";
  readonly name = "Coin Change (Minimum Coins)";
  readonly category = "DYNAMIC_PROGRAMMING";
  readonly description = "Finds the minimum number of coins needed to make up a given amount, or -1 if impossible.";
  readonly supportedDifficulties = ["MEDIUM", "HARD"];

  readonly parameterSchema = {
    amount: { type: "integer", min: 1, max: 100, default: 11 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const amount = typeof parameters.amount === "number" ? Math.max(1, Math.min(100, parameters.amount)) : 11;
    const coins = [1, 2, 5];
    return { coins, amount };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const coins = Array.isArray(input.coins) ? input.coins : [1, 2, 5];
    const amount = typeof input.amount === "number" ? Math.max(0, input.amount) : 0;

    const dp = Array(amount + 1).fill(Infinity);
    dp[0] = 0;

    for (let i = 1; i <= amount; i++) {
      for (const coin of coins) {
        if (typeof coin === "number" && i - coin >= 0) {
          dp[i] = Math.min(dp[i], dp[i - coin] + 1);
        }
      }
    }

    const minCoins = dp[amount] === Infinity ? -1 : dp[amount];

    return {
      minCoins,
      result: minCoins,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.coins)) errors.push("Input property 'coins' must be an array.");
    if (typeof input.amount !== "number" || input.amount < 0) errors.push("Input property 'amount' must be a non-negative integer.");
    return errors;
  }
}

/**
 * 80. DP_MIN_STEPS_ORACLE
 */
@Injectable()
export class DpMinStepsOracle extends BaseOracle {
  readonly key = "DP_MIN_STEPS_ORACLE";
  readonly name = "Minimum Steps to One";
  readonly category = "DYNAMIC_PROGRAMMING";
  readonly description = "Calculates minimum steps to reduce N to 1 using operations (-1, /2, /3).";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 200, default: 10 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? Math.max(1, Math.min(200, parameters.n)) : 10;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? Math.max(1, input.n) : 1;

    const dp = Array(n + 1).fill(0);
    for (let i = 2; i <= n; i++) {
      let res = dp[i - 1] + 1;
      if (i % 2 === 0) res = Math.min(res, dp[i / 2] + 1);
      if (i % 3 === 0) res = Math.min(res, dp[i / 3] + 1);
      dp[i] = res;
    }

    return {
      minSteps: dp[n],
      result: dp[n],
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number" || input.n < 1) errors.push("Input property 'n' must be a positive integer.");
    return errors;
  }
}

/**
 * 81. DP_KNAPSACK_ORACLE
 */
@Injectable()
export class DpKnapsackOracle extends BaseOracle {
  readonly key = "DP_KNAPSACK_ORACLE";
  readonly name = "0/1 Knapsack Problem";
  readonly category = "DYNAMIC_PROGRAMMING";
  readonly description = "Solves the 0/1 Knapsack problem for optimal total value.";
  readonly supportedDifficulties = ["MEDIUM", "HARD"];

  readonly parameterSchema = {
    itemCount: { type: "integer", min: 3, max: 8, default: 4 },
    capacity: { type: "integer", min: 5, max: 50, default: 10 },
    seedVal: { type: "integer", min: 1, max: 50, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const count = typeof parameters.itemCount === "number" ? Math.max(2, Math.min(8, parameters.itemCount)) : 4;
    const capacity = typeof parameters.capacity === "number" ? Math.max(5, Math.min(50, parameters.capacity)) : 10;
    const seed = typeof parameters.seedVal === "number" ? parameters.seedVal : 1;

    const weights = [];
    const values = [];
    for (let i = 0; i < count; i++) {
      weights.push(((i * 2 + seed) % 6) + 1);
      values.push(((i * 15 + seed * 3) % 50) + 10);
    }
    return { weights, values, capacity };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const weights = Array.isArray(input.weights) ? input.weights : [];
    const values = Array.isArray(input.values) ? input.values : [];
    const capacity = typeof input.capacity === "number" ? Math.max(0, input.capacity) : 0;
    const n = Math.min(weights.length, values.length);

    const dp = Array(capacity + 1).fill(0);
    for (let i = 0; i < n; i++) {
      const w = weights[i];
      const v = values[i];
      for (let c = capacity; c >= w; c--) {
        dp[c] = Math.max(dp[c], dp[c - w] + v);
      }
    }

    return {
      maxValue: dp[capacity],
      result: dp[capacity],
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.weights)) errors.push("Input property 'weights' must be an array.");
    if (!Array.isArray(input.values)) errors.push("Input property 'values' must be an array.");
    if (typeof input.capacity !== "number") errors.push("Input property 'capacity' must be a number.");
    return errors;
  }
}

/**
 * 82. DP_CLIMBING_STAIRS_ORACLE
 */
@Injectable()
export class DpClimbingStairsOracle extends BaseOracle {
  readonly key = "DP_CLIMBING_STAIRS_ORACLE";
  readonly name = "Climbing Stairs";
  readonly category = "DYNAMIC_PROGRAMMING";
  readonly description = "Calculates the number of distinct ways to climb N stairs taking 1 or 2 steps.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 30, default: 5 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? Math.max(1, Math.min(30, parameters.n)) : 5;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? Math.max(1, Math.min(35, input.n)) : 1;

    if (n <= 1) return { ways: 1, result: 1 };
    if (n === 2) return { ways: 2, result: 2 };

    let prev2 = 1;
    let prev1 = 2;
    for (let i = 3; i <= n; i++) {
      const curr = prev1 + prev2;
      prev2 = prev1;
      prev1 = curr;
    }

    return {
      ways: prev1,
      result: prev1,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number" || input.n < 1) errors.push("Input property 'n' must be a positive integer.");
    return errors;
  }
}

/**
 * 83. DP_MAX_SUBARRAY_ORACLE
 */
@Injectable()
export class DpMaxSubarrayOracle extends BaseOracle {
  readonly key = "DP_MAX_SUBARRAY_ORACLE";
  readonly name = "Maximum Subarray Sum (Kadane's Algorithm)";
  readonly category = "DYNAMIC_PROGRAMMING";
  readonly description = "Finds the maximum contiguous subarray sum.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 2, max: 20, default: 8 },
    seedVal: { type: "integer", min: 1, max: 50, default: 3 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(2, parameters.arraySize) : 8;
    const seed = typeof parameters.seedVal === "number" ? parameters.seedVal : 3;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      const val = ((i * seed * 7 + 11) % 25) - 10; // Mix of positive and negative integers
      arr.push(val);
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];
    if (arr.length === 0) return { maxSubarraySum: 0, result: 0 };

    let maxSoFar = arr[0];
    let currMax = arr[0];

    for (let i = 1; i < arr.length; i++) {
      const val = typeof arr[i] === "number" ? arr[i] : 0;
      currMax = Math.max(val, currMax + val);
      maxSoFar = Math.max(maxSoFar, currMax);
    }

    return {
      maxSubarraySum: maxSoFar,
      result: maxSoFar,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr) || input.arr.length === 0) {
      errors.push("Input property 'arr' must be a non-empty array.");
    }
    return errors;
  }
}
