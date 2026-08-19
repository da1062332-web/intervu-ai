import { Test, TestingModule } from "@nestjs/testing";
import { OracleRegistry } from "../oracle.registry";
import { ORACLE_PROVIDERS_TOKEN } from "../oracle.constants";
import * as StandardOracles from "../standard-oracles";
import { BaseOracle } from "../base.oracle";
import { Injectable } from "@nestjs/common";

@Injectable()
class CustomDynamicOracle extends BaseOracle {
  readonly key = "CUSTOM_DYNAMIC_TEST_ORACLE";
  readonly name = "Custom Dynamic Test Oracle";
  readonly category = "GENERAL";
  readonly description = "Custom dynamic oracle created during registry testing.";

  generateInput(): Record<string, any> {
    return { val: 42 };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    return { result: input.val * 2 };
  }
}

describe("OracleRegistry", () => {
  let registry: OracleRegistry;

  beforeEach(async () => {
    const oracleClasses = Object.values(StandardOracles).filter(
      (item) => typeof item === "function" && item.prototype,
    ) as any[];

    const providersList = oracleClasses.map((Cls) => new Cls());

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ORACLE_PROVIDERS_TOKEN,
          useValue: providersList,
        },
        OracleRegistry,
      ],
    }).compile();

    registry = moduleRef.get<OracleRegistry>(OracleRegistry);
  });

  it("should discover all 95 catalog oracles via ORACLE_PROVIDERS_TOKEN", () => {
    expect(registry.getAllOracles().length).toBe(95);
    expect(registry.hasOracle("BASIC_GRADE_CALCULATOR_ORACLE")).toBe(true);
    expect(registry.hasOracle("BASIC_ELIGIBILITY_CHECK_ORACLE")).toBe(true);
    expect(registry.hasOracle("STRING_PALINDROME_ORACLE")).toBe(true);
    expect(registry.hasOracle("ARRAY_SUM_ORACLE")).toBe(true);
    expect(registry.hasOracle("MATH_PRIME_CHECK_ORACLE")).toBe(true);
    expect(registry.hasOracle("RECURSION_FACTORIAL_ORACLE")).toBe(true);
    expect(registry.hasOracle("SORT_BUBBLE_SORT_ORACLE")).toBe(true);
    expect(registry.hasOracle("MATRIX_TRANSPOSE_ORACLE")).toBe(true);
    expect(registry.hasOracle("SIMULATION_BANK_ACCOUNT_ORACLE")).toBe(true);
    expect(registry.hasOracle("DP_COIN_CHANGE_ORACLE")).toBe(true);
    expect(registry.hasOracle("LOGIC_SCHEDULING_ORACLE")).toBe(true);

    // Verify 6 LOOP oracles
    expect(registry.hasOracle("LOOP_STAR_PATTERN_ORACLE")).toBe(true);
    expect(registry.hasOracle("LOOP_NUMBER_PATTERN_ORACLE")).toBe(true);
    expect(registry.hasOracle("LOOP_PYRAMID_PATTERN_ORACLE")).toBe(true);
    expect(registry.hasOracle("LOOP_INVERTED_PATTERN_ORACLE")).toBe(true);
    expect(registry.hasOracle("LOOP_MULTIPLICATION_TABLE_ORACLE")).toBe(true);
    expect(registry.hasOracle("LOOP_RANGE_SUM_ORACLE")).toBe(true);
  });

  it("should return valid metadata for all registered oracles", () => {
    const metadata = registry.getAllMetadata();
    expect(metadata.length).toBe(95);

    const gradeMeta = metadata.find((m) => m.key === "BASIC_GRADE_CALCULATOR_ORACLE");
    expect(gradeMeta).toBeDefined();
    expect(gradeMeta?.category).toBe("BASIC");
    expect(gradeMeta?.name).toBe("Basic Grade Calculator");

    const loopMeta = metadata.find((m) => m.key === "LOOP_STAR_PATTERN_ORACLE");
    expect(loopMeta).toBeDefined();
    expect(loopMeta?.category).toBe("LOOP");
    expect(loopMeta?.name).toBe("Left-Aligned Star Pattern");
  });

  it("should allow registering a new oracle dynamically at runtime", () => {
    const dynamicOracle = new CustomDynamicOracle();
    registry.registerOracle(dynamicOracle);

    expect(registry.hasOracle("CUSTOM_DYNAMIC_TEST_ORACLE")).toBe(true);
    const meta = registry.getMetadataByKey("CUSTOM_DYNAMIC_TEST_ORACLE");
    expect(meta.key).toBe("CUSTOM_DYNAMIC_TEST_ORACLE");
    expect(meta.description).toBe("Custom dynamic oracle created during registry testing.");
  });

  it("should throw NotFoundException for unregistered oracle keys", () => {
    expect(registry.hasOracle("NON_EXISTENT_ORACLE")).toBe(false);
    expect(() => registry.getOracle("NON_EXISTENT_ORACLE")).toThrow();
  });
});
