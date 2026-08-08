export type OracleCategory =
  | "ARRAY"
  | "STRING"
  | "MATH"
  | "SEARCHING"
  | "SORTING"
  | "TREE"
  | "GRAPH"
  | "DYNAMIC_PROGRAMMING"
  | "GENERAL";

export interface OracleMetadata {
  key: string;
  name: string;
  category: OracleCategory | string;
  description: string;
  supportedDifficulties: string[];
  parameterSchema?: Record<string, any>;
}

export interface BaseOracle {
  readonly key: string;
  readonly name: string;
  readonly category?: OracleCategory | string;
  readonly description?: string;
  readonly supportedDifficulties?: string[];
  readonly parameterSchema?: Record<string, any>;

  /**
   * Generates input structure from parameter dictionary.
   */
  generateInput(parameters: Record<string, any>): Record<string, any>;

  /**
   * Computes expected output given an input structure.
   */
  generateExpectedOutput(input: Record<string, any>): Record<string, any>;

  /**
   * Optional custom validation for input structure.
   */
  validateInput?(input: Record<string, any>): string[];

  /**
   * Optional custom validation for input/output matching.
   */
  validateOutput?(input: Record<string, any>, output: Record<string, any>): string[];
}
