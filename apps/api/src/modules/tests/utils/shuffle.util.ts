/**
 * Safely shuffles an array using the Fisher-Yates algorithm.
 * This function is pure and does not mutate the input array.
 * It is used for MVP Phase 4 question and option shuffling.
 *
 * @param items - The readonly input array to shuffle
 * @returns A new array containing the shuffled elements
 */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
