import { Injectable } from "@nestjs/common";

/**
 * Pseudo-Random Number Generator using Mulberry32 algorithm.
 * Guarantees 100% deterministic reproducibility for any given integer seed.
 */
export class SeededPRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /**
   * Returns a pseudo-random float between 0 (inclusive) and 1 (exclusive).
   */
  nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a pseudo-random integer in [min, max] inclusive.
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  /**
   * Selects a random element from an array.
   */
  choice<T>(arr: T[]): T {
    const idx = this.nextInt(0, arr.length - 1);
    return arr[idx];
  }
}

@Injectable()
export class SeededParameterGeneratorService {
  /**
   * Generates a parameters record dynamically evaluating parameterSchema with a deterministic PRNG seed and difficulty tier.
   */
  generateParameters(
    parameterSchema: Record<string, any>,
    seed: number = 42,
    difficulty?: string,
  ): Record<string, any> {
    const diffUpper = (difficulty || "").toUpperCase();
    // Factor difficulty into seed offset so EASY, MEDIUM, and HARD generate distinct parameter sets for the same base seed
    const diffSeedOffset = diffUpper === "EASY" ? 1000 : diffUpper === "HARD" ? 3000 : 2000;
    const prng = new SeededPRNG(seed + diffSeedOffset);
    const result: Record<string, any> = {};

    if (!parameterSchema || typeof parameterSchema !== "object") {
      return result;
    }

    for (const [key, spec] of Object.entries(parameterSchema)) {
      if (typeof spec !== "object" || spec === null) {
        result[key] = spec;
        continue;
      }

      const type = spec.type || "integer";

      switch (type.toLowerCase()) {
        case "integer":
        case "int": {
          const rawMin = typeof spec.min === "number" ? spec.min : 1;
          const rawMax = typeof spec.max === "number" ? spec.max : 100;
          let min = rawMin;
          let max = rawMax;

          if (diffUpper === "EASY") {
            max = Math.max(min + 1, Math.floor(min + (rawMax - min) * 0.35));
          } else if (diffUpper === "HARD") {
            min = Math.floor(min + (rawMax - min) * 0.5);
            max = rawMax;
          } else if (diffUpper === "MEDIUM") {
            min = Math.floor(min + (rawMax - min) * 0.2);
            max = Math.floor(min + (rawMax - min) * 0.75);
          }

          if (min > max) [min, max] = [max, min];
          result[key] = prng.nextInt(min, max);
          break;
        }
        case "float":
        case "number": {
          const rawMin = typeof spec.min === "number" ? spec.min : 0.0;
          const rawMax = typeof spec.max === "number" ? spec.max : 100.0;
          let min = rawMin;
          let max = rawMax;

          if (diffUpper === "EASY") {
            max = min + (rawMax - min) * 0.35;
          } else if (diffUpper === "HARD") {
            min = min + (rawMax - min) * 0.5;
          } else if (diffUpper === "MEDIUM") {
            min = min + (rawMax - min) * 0.2;
            max = min + (rawMax - min) * 0.75;
          }

          const raw = prng.nextFloat() * (max - min) + min;
          const decimals = typeof spec.decimals === "number" ? spec.decimals : 2;
          result[key] = parseFloat(raw.toFixed(decimals));
          break;
        }
        case "boolean": {
          result[key] = prng.nextFloat() > 0.5;
          break;
        }
        case "enum":
        case "choice":
        case "string": {
          const options = Array.isArray(spec.options) ? spec.options : [];
          if (options.length > 0) {
            let sliceOptions = options;
            if (diffUpper === "EASY" && options.length >= 3) {
              sliceOptions = options.slice(0, Math.ceil(options.length / 3));
            } else if (diffUpper === "HARD" && options.length >= 3) {
              sliceOptions = options.slice(Math.floor((options.length * 2) / 3));
            } else if (diffUpper === "MEDIUM" && options.length >= 3) {
              sliceOptions = options.slice(
                Math.floor(options.length / 4),
                Math.ceil((options.length * 3) / 4),
              );
            }
            result[key] = prng.choice(sliceOptions.length > 0 ? sliceOptions : options);
          } else {
            result[key] = spec.default || "sample_string";
          }
          break;
        }
        default:
          result[key] = spec.default !== undefined ? spec.default : null;
      }
    }

    return result;
  }
}
