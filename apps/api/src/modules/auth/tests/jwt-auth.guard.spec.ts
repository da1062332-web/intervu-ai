import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
    delete process.env.INTERNAL_SERVICE_TOKEN;
  });

  afterEach(() => {
    delete process.env.INTERNAL_SERVICE_TOKEN;
    jest.restoreAllMocks();
  });

  const createMockContext = (
    headers: Record<string, string> = {},
    isPublic = false,
  ): { context: ExecutionContext; req: Record<string, any> } => {
    const req: Record<string, any> = { headers };
    const context = {
      getType: () => "http",
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(isPublic);

    return { context, req };
  };

  describe("Internal Service Token Validation", () => {
    it("should allow internal service calls using the default secret token and set admin user context", async () => {
      const { context, req } = createMockContext({
        "x-internal-service-token": "internal_secret_token",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(req.user).toEqual({
        id: "internal-worker",
        email: "worker@internal.service",
        role: "ADMIN",
      });
    });

    it("should allow internal service calls when matching custom INTERNAL_SERVICE_TOKEN env var", async () => {
      process.env.INTERNAL_SERVICE_TOKEN = "custom-prod-secret-12345";

      const { context, req } = createMockContext({
        "x-internal-service-token": "custom-prod-secret-12345",
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(req.user).toEqual({
        id: "internal-worker",
        email: "worker@internal.service",
        role: "ADMIN",
      });
    });

    it("should return internal worker user from handleRequest if already set", () => {
      const { context, req } = createMockContext();
      req.user = {
        id: "internal-worker",
        email: "worker@internal.service",
        role: "ADMIN",
      };

      const user = guard.handleRequest(null, null, null, context);

      expect(user).toEqual(req.user);
    });
  });

  describe("Public Route Handling", () => {
    it("should allow access to public routes without credentials", async () => {
      const { context } = createMockContext({}, true);

      // Super canActivate would throw or fail if passport is invoked without token,
      // but public handler swallows it and returns true
      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), "canActivate").mockRejectedValue(new Error("No token"));

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it("should not throw in handleRequest on public routes when user is null", () => {
      const { context } = createMockContext({}, true);

      const user = guard.handleRequest(null, null, null, context);
      expect(user).toBeNull();
    });
  });

  describe("Unauthorized handling", () => {
    it("should throw UnauthorizedException when no user and not public", () => {
      const { context } = createMockContext({}, false);

      expect(() => {
        guard.handleRequest(null, null, null, context);
      }).toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException when error is present", () => {
      const { context } = createMockContext({}, false);

      expect(() => {
        guard.handleRequest(new Error("JWT expired"), null, null, context);
      }).toThrow(UnauthorizedException);
    });
  });
});
