import { Test, TestingModule } from "@nestjs/testing";
import { OracleRegistry } from "../oracle.registry";
import { ORACLE_PROVIDERS_TOKEN } from "../oracle.constants";
import { ArrayRotationOracle } from "../array-rotation.oracle";
import { PalindromeOracle } from "../palindrome.oracle";
import { BaseOracle } from "../base.oracle";
import { Injectable } from "@nestjs/common";

@Injectable()
class CustomTestOracle extends BaseOracle {
  readonly key = "CUSTOM_TEST_ORACLE";
  readonly name = "Custom Test Oracle";
  readonly category = "TREE";
  readonly description = "Custom oracle created during unit testing.";

  generateInput(): Record<string, any> {
    return { val: 42 };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    return { result: input.val * 2 };
  }
}

describe("OracleRegistry", () => {
  let registry: OracleRegistry;

  const testOracles = [new ArrayRotationOracle(), new PalindromeOracle(), new CustomTestOracle()];

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ORACLE_PROVIDERS_TOKEN,
          useValue: testOracles,
        },
        OracleRegistry,
      ],
    }).compile();

    registry = moduleRef.get<OracleRegistry>(OracleRegistry);
  });

  it("should discover all injected oracles via ORACLE_PROVIDERS_TOKEN", () => {
    expect(registry.hasOracle("ARRAY_ROTATION_ORACLE")).toBe(true);
    expect(registry.hasOracle("PALINDROME_ORACLE")).toBe(true);
    expect(registry.hasOracle("CUSTOM_TEST_ORACLE")).toBe(true);
  });

  it("should return safe metadata for all registered oracles", () => {
    const metadata = registry.getAllMetadata();
    expect(metadata.length).toBe(3);

    const customMeta = metadata.find((m) => m.key === "CUSTOM_TEST_ORACLE");
    expect(customMeta).toBeDefined();
    expect(customMeta?.category).toBe("TREE");
    expect(customMeta?.name).toBe("Custom Test Oracle");
    expect(customMeta?.description).toBe("Custom oracle created during unit testing.");
  });

  it("should allow registering a new oracle dynamically without modifying frontend", () => {
    const dynamicOracle = new CustomTestOracle();
    registry.registerOracle(dynamicOracle);

    expect(registry.hasOracle("CUSTOM_TEST_ORACLE")).toBe(true);
    const meta = registry.getMetadataByKey("CUSTOM_TEST_ORACLE");
    expect(meta.key).toBe("CUSTOM_TEST_ORACLE");
  });

  it("should throw NotFoundException for unregistered oracle keys", () => {
    expect(registry.hasOracle("NON_EXISTENT_ORACLE")).toBe(false);
    expect(() => registry.getOracle("NON_EXISTENT_ORACLE")).toThrow();
  });
});

