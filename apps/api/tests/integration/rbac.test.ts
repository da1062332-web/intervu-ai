import {
  Controller,
  Get,
  INestApplication,
  Injectable,
  CanActivate,
  ExecutionContext,
} from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Roles } from "../../src/modules/auth/decorators/roles.decorator";
import { RolesGuard } from "../../src/modules/auth/guards/roles.guard";
import { UserRole } from "@prisma/client";
import { APP_GUARD } from "@nestjs/core";
import { GlobalExceptionFilter, ResponseInterceptor } from "@intervu/shared";

// 1. Dynamic Auth Guard to mock JwtAuthGuard and inject user context based on headers
@Injectable()
class DynamicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const roleHeader = req.headers["x-test-role"];

    if (roleHeader) {
      req.user = {
        id: "user-1",
        email: "user@example.com",
        role: roleHeader as UserRole,
      };
    }
    return true;
  }
}

// 2. Test Controllers with different RBAC decorators
@Controller("test-admin")
@Roles(UserRole.ADMIN)
class TestAdminController {
  @Get()
  getAdminData() {
    return { message: "admin-access" };
  }
}

@Controller("test-candidate")
@Roles(UserRole.CANDIDATE)
class TestCandidateController {
  @Get()
  getCandidateData() {
    return { message: "candidate-access" };
  }
}

@Controller("test-shared")
@Roles(UserRole.ADMIN, UserRole.CANDIDATE)
class TestSharedController {
  @Get()
  getSharedData() {
    return { message: "shared-access" };
  }
}

describe("RBAC Authorization Integration Tests", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        TestAdminController,
        TestCandidateController,
        TestSharedController,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: DynamicAuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Admin Routes", () => {
    it("should allow ADMIN to access ADMIN routes", async () => {
      const res = await request(app.getHttpServer())
        .get("/test-admin")
        .set("x-test-role", "ADMIN");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe("admin-access");
    });

    it("should reject CANDIDATE accessing ADMIN routes with 403 Forbidden", async () => {
      const res = await request(app.getHttpServer())
        .get("/test-admin")
        .set("x-test-role", "CANDIDATE");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("should reject anonymous requests accessing ADMIN routes with 403 Forbidden", async () => {
      const res = await request(app.getHttpServer()).get("/test-admin");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("Candidate Routes", () => {
    it("should allow CANDIDATE to access CANDIDATE routes", async () => {
      const res = await request(app.getHttpServer())
        .get("/test-candidate")
        .set("x-test-role", "CANDIDATE");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe("candidate-access");
    });

    it("should reject ADMIN accessing CANDIDATE routes with 403 Forbidden", async () => {
      const res = await request(app.getHttpServer())
        .get("/test-candidate")
        .set("x-test-role", "ADMIN");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("Shared Routes", () => {
    it("should allow ADMIN to access shared routes", async () => {
      const res = await request(app.getHttpServer())
        .get("/test-shared")
        .set("x-test-role", "ADMIN");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe("shared-access");
    });

    it("should allow CANDIDATE to access shared routes", async () => {
      const res = await request(app.getHttpServer())
        .get("/test-shared")
        .set("x-test-role", "CANDIDATE");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe("shared-access");
    });
  });
});
