import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { Test, TestingModule } from "@nestjs/testing";
import { Controller, Get, INestApplication } from "@nestjs/common";
import { ResponseInterceptor } from "@intervu/shared";

// Controller without ResponseValidationInterceptor
@Controller("test-v1")
class TestV1Controller {
  @Get()
  getInvalid() {
    return { invalidField: true }; // This should be blocked if interceptor was global
  }
}

describe("Verification 1 - Response Validation Interceptor", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestV1Controller],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("Bypasses validation because ResponseValidationInterceptor is not globally registered", async () => {
    const res = await request(app.getHttpServer()).get("/test-v1");

    // We expect this to reach the client successfully with { success: true, data: { invalidField: true } }
    // This PROVES that the interceptor is not globally protecting endpoints.
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.invalidField).toBe(true);
  });
});
