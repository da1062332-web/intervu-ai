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
   * Generates a parameters record dynamically evaluating parameterSchema with a deterministic PRNG seed.
   */
  generateParameters(
    parameterSchema: Record<string, any>,
    seed: number = 42,
  ): Record<string, any> {
    const prng = new SeededPRNG(seed);
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
          const min = typeof spec.min === "number" ? spec.min : 1;
          const max = typeof spec.max === "number" ? spec.max : 100;
          result[key] = prng.nextInt(min, max);
          break;
        }
        case "float":
        case "number": {
          const min = typeof spec.min === "number" ? spec.min : 0.0;
          const max = typeof spec.max === "number" ? spec.max : 1.0;
          const raw = prng.nextFloat() * (max - min) + min;
          const decimals =
            typeof spec.decimals === "number" ? spec.decimals : 2;
          result[key] = parseFloat(raw.toFixed(decimals));
          break;
        }
        case "boolean": {
          result[key] = prng.nextFloat() > 0.5;
          break;
        }
        case "enum":
        case "choice": {
          const options = Array.isArray(spec.options) ? spec.options : [];
          result[key] =
            options.length > 0 ? prng.choice(options) : (spec.default ?? null);
          break;
        }
        case "string": {
          if (Array.isArray(spec.options) && spec.options.length > 0) {
            result[key] = prng.choice(spec.options);
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
