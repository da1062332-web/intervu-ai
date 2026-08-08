import { Test, TestingModule } from "@nestjs/testing";
import { CodingPatternController } from "../coding-pattern.controller";
import { CodingPatternService } from "../../services/coding-pattern.service";
import { OracleRegistry } from "../../oracles/oracle.registry";
import { ArrayRotationOracle } from "../../oracles/array-rotation.oracle";
import { ORACLE_PROVIDERS_TOKEN } from "../../oracles/oracle.constants";

describe("CodingPatternController - Oracle Endpoints", () => {
  let controller: CodingPatternController;
  let registry: OracleRegistry;

  beforeEach(async () => {
    const arrayRotationOracle = new ArrayRotationOracle();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CodingPatternController],
      providers: [
        {
          provide: CodingPatternService,
          useValue: {
            createPattern: jest.fn(),
            getAllPatterns: jest.fn(),
            getPatternById: jest.fn(),
            updatePattern: jest.fn(),
            deletePattern: jest.fn(),
          },
        },
        {
          provide: ORACLE_PROVIDERS_TOKEN,
          useValue: [arrayRotationOracle],
        },
        OracleRegistry,
      ],
    }).compile();

    controller = moduleRef.get<CodingPatternController>(CodingPatternController);
    registry = moduleRef.get<OracleRegistry>(OracleRegistry);
  });

  it("GET /coding-patterns/oracles - should return safe oracle metadata array", async () => {
    const result = await controller.getOracles();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        key: "ARRAY_ROTATION_ORACLE",
        name: "Array Rotation",
        category: "ARRAY",
      }),
    );
  });

  it("GET /coding-patterns/oracles/validate/:key - should validate valid key", async () => {
    const result = await controller.validateOracleKey("ARRAY_ROTATION_ORACLE");
    expect(result).toEqual({
      valid: true,
      key: "ARRAY_ROTATION_ORACLE",
      metadata: expect.objectContaining({
        key: "ARRAY_ROTATION_ORACLE",
        name: "Array Rotation",
      }),
    });
  });

  it("GET /coding-patterns/oracles/validate/:key - should throw 404 for invalid key", async () => {
    await expect(controller.validateOracleKey("INVALID_ORACLE")).rejects.toThrow();
  });
});
