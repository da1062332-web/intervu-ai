import { CodingOracleService } from "../coding-oracle.service";
import { CodingOracleRepository } from "../../repositories/coding-oracle.repository";
import { OracleRegistry } from "../../oracles/oracle.registry";
import { ArrayRotationOracle } from "../../oracles/array-rotation.oracle";
import { BadRequestException } from "@nestjs/common";

describe("CodingOracleService", () => {
  let service: CodingOracleService;
  let repo: jest.Mocked<CodingOracleRepository>;
  let registry: OracleRegistry;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      upsertByKey: jest.fn(),
      findById: jest.fn(),
      findByKey: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      toggleStatus: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    const arrayRotationOracle = new ArrayRotationOracle();
    registry = new OracleRegistry([arrayRotationOracle]);

    service = new CodingOracleService(repo, registry);
  });

  it("should sync backend providers into DB during onModuleInit", async () => {
    repo.findAll.mockResolvedValue({ items: [], total: 1 });

    await service.onModuleInit();

    expect(repo.upsertByKey).toHaveBeenCalledWith("ARRAY_ROTATION_ORACLE", expect.anything());
  });

  it("should enrich oracle list items with isProviderAvailable flag", async () => {
    repo.findAll.mockResolvedValue({
      items: [
        {
          id: "1",
          key: "ARRAY_ROTATION_ORACLE",
          name: "Array Rotation",
          category: "ARRAY",
          description: "Test",
          supportedDifficulties: ["EASY"],
          parameterSchema: {},
          metadata: {},
          isActive: true,
          isSystem: true,
          version: 1,
          creatorId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          _count: { patterns: 3 },
        },
        {
          id: "2",
          key: "UNIMPLEMENTED_ORACLE",
          name: "Unimplemented Oracle",
          category: "OTHER",
          description: "No code yet",
          supportedDifficulties: ["EASY"],
          parameterSchema: {},
          metadata: {},
          isActive: true,
          isSystem: false,
          version: 1,
          creatorId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          _count: { patterns: 0 },
        },
      ],
      total: 2,
    });

    const res = await service.getAllOracles();
    expect(res.items.length).toBe(2);

    const rotation = res.items.find((i) => i.key === "ARRAY_ROTATION_ORACLE");
    expect(rotation?.isProviderAvailable).toBe(true);
    expect(rotation?.patternCount).toBe(3);

    const unimplemented = res.items.find((i) => i.key === "UNIMPLEMENTED_ORACLE");
    expect(unimplemented?.isProviderAvailable).toBe(false);
  });

  it("should throw BadRequestException if oracle is inactive or provider missing during validation", async () => {
    // 1. Missing in DB
    repo.findByKey.mockResolvedValueOnce(null);
    await expect(service.validateOracleForUsage("MISSING_KEY")).rejects.toThrow(BadRequestException);

    // 2. Inactive in DB
    repo.findByKey.mockResolvedValueOnce({
      id: "1",
      key: "INACTIVE_KEY",
      name: "Inactive Oracle",
      category: "GENERAL",
      description: "",
      supportedDifficulties: [],
      parameterSchema: {},
      metadata: {},
      isActive: false,
      isSystem: true,
      version: 1,
      creatorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    await expect(service.validateOracleForUsage("INACTIVE_KEY")).rejects.toThrow(BadRequestException);

    // 3. Active in DB, but provider missing in code
    repo.findByKey.mockResolvedValueOnce({
      id: "2",
      key: "NO_PROVIDER_KEY",
      name: "No Provider Oracle",
      category: "GENERAL",
      description: "",
      supportedDifficulties: [],
      parameterSchema: {},
      metadata: {},
      isActive: true,
      isSystem: false,
      version: 1,
      creatorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    await expect(service.validateOracleForUsage("NO_PROVIDER_KEY")).rejects.toThrow(BadRequestException);
  });

  it("should validate successfully when oracle is active and provider is ready", async () => {
    repo.findByKey.mockResolvedValueOnce({
      id: "1",
      key: "ARRAY_ROTATION_ORACLE",
      name: "Array Rotation",
      category: "ARRAY",
      description: "",
      supportedDifficulties: [],
      parameterSchema: {},
      metadata: {},
      isActive: true,
      isSystem: true,
      version: 1,
      creatorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    await expect(service.validateOracleForUsage("ARRAY_ROTATION_ORACLE")).resolves.not.toThrow();
  });
});
