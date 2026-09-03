import { Test, TestingModule } from "@nestjs/testing";
import { Reflector } from "@nestjs/core";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { EntitlementGuard } from "../guards/entitlement.guard";
import { EntitlementService } from "../services/entitlement.service";

describe("EntitlementGuard", () => {
  let guard: EntitlementGuard;
  let mockGetAllAndOverride: jest.Mock;
  let mockHasEntitlement: jest.Mock;

  beforeEach(async () => {
    mockGetAllAndOverride = jest.fn();
    mockHasEntitlement = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: mockGetAllAndOverride,
          },
        },
        {
          provide: EntitlementService,
          useValue: {
            hasEntitlement: mockHasEntitlement,
          },
        },
      ],
    }).compile();

    guard = module.get<EntitlementGuard>(EntitlementGuard);
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  it("should allow request if no requirement metadata is set", async () => {
    mockGetAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ id: "user-1" });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should allow request if user has the required entitlement", async () => {
    mockGetAllAndOverride.mockReturnValue({
      feature: "voiceInterviews",
    });
    mockHasEntitlement.mockResolvedValue(true);
    const context = createMockContext({ id: "user-1" });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should throw ForbiddenException if user lacks entitlement", async () => {
    mockGetAllAndOverride.mockReturnValue({
      feature: "voiceInterviews",
    });
    mockHasEntitlement.mockResolvedValue(false);
    const context = createMockContext({ id: "user-free" });

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
