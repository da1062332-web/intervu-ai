import { PRNG } from "@intervu-ai/generation";
export { PRNG };

/**
 * Creates a numeric seed from a string identifier (e.g. templateKey + difficulty).
 */
export function generateSeedFromString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
