import { analyzeMathjsExpression } from "./expression-utils";

describe("expression-utils", () => {
  it("extracts gcd function names without treating gcd as an identifier", () => {
    const analysis = analyzeMathjsExpression(
      "gcd(rawSumNumerator, rawSumDenominator)",
    );

    expect(analysis.identifiers.sort()).toEqual([
      "rawSumDenominator",
      "rawSumNumerator",
    ]);
    expect(analysis.functionNames).toEqual(["gcd"]);
  });
});
