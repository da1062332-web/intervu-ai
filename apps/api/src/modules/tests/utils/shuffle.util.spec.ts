import { shuffleArray } from "./shuffle.util";

describe("shuffleArray", () => {
  beforeEach(() => {
    jest.spyOn(Math, "random");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should preserve all elements and length", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toHaveLength(input.length);
    expect(result.sort()).toEqual([...input].sort());
  });

  it("should not mutate the input array", () => {
    const input = [1, 2, 3];
    const inputClone = [...input];
    shuffleArray(input);
    expect(input).toEqual(inputClone);
  });

  it("should handle empty arrays", () => {
    const result = shuffleArray([]);
    expect(result).toEqual([]);
  });

  it("should handle single element arrays", () => {
    const result = shuffleArray(["A"]);
    expect(result).toEqual(["A"]);
  });

  it("should swap elements based on randomness", () => {
    // Mock Math.random to return exactly 0 to swap deterministically.
    // i=2, j=0 => swap(2, 0)
    // i=1, j=0 => swap(1, 0)
    (Math.random as jest.Mock).mockReturnValue(0);
    const input = ["A", "B", "C"];
    const result = shuffleArray(input);

    // Original: ["A", "B", "C"]
    // i=2: j=0 -> swap A and C -> ["C", "B", "A"]
    // i=1: j=0 -> swap C and B -> ["B", "C", "A"]
    expect(result).toEqual(["B", "C", "A"]);
  });
});
