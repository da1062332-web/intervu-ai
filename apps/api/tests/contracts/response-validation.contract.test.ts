import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, Controller, Get } from "@nestjs/common";
import request from "supertest";
import { z } from "zod";
import { ValidateResponse } from "@intervu/shared";
import {
  ResponseValidationInterceptor,
  ResponseInterceptor,
} from "@intervu/shared";
import { Reflector } from "@nestjs/core";

const TestSchema = z.object({
  id: z.string(),
  name: z.string(),
});

@Controller("test")
class TestController {
  @Get("valid")
  @ValidateResponse(TestSchema)
  getValid() {
    return { id: "123", name: "John Doe" };
  }

  @Get("invalid")
  @ValidateResponse(TestSchema)
  getInvalid() {
    return { id: "123" }; // missing name
  }

  @Get("passthrough")
  getPassthrough() {
    return { any: "data" };
  }
}

describe("ResponseValidationInterceptor", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();

    const reflector = app.get(Reflector);
    // Simulate main.ts behavior
    app.useGlobalInterceptors(
      new ResponseInterceptor(),
      new ResponseValidationInterceptor(reflector),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should pass validation and return 200 OK with success envelope", async () => {
    const response = await request(app.getHttpServer()).get("/test/valid");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { id: "123", name: "John Doe" },
      error: null,
      meta: null,
    });
  });

  it("should throw ContractViolationError and return 500 when response is invalid", async () => {
    const response = await request(app.getHttpServer()).get("/test/invalid");

    expect(response.status).toBe(500); // Because ContractViolationError is not caught by a specific exception filter in this test, it results in 500.
  });

  it("should passthrough when no schema is provided", async () => {
    const response = await request(app.getHttpServer()).get(
      "/test/passthrough",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { any: "data" },
      error: null,
      meta: null,
    });
  });
});
