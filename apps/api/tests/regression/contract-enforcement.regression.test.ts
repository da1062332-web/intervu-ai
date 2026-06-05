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

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

@Controller("regression")
class RegressionController {
  @Get("schema-match")
  @ValidateResponse(UserSchema)
  getValid() {
    return { id: "user-1", name: "Regression User" };
  }

  @Get("schema-mismatch")
  @ValidateResponse(UserSchema)
  getInvalid() {
    return { id: "user-1" }; // missing name, should fail validation
  }

  @Get("schema-passthrough")
  @ValidateResponse(z.unknown())
  getPassthrough() {
    return { some: "dynamic", data: true };
  }
}

describe("Contract Enforcement Regression Tests", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [RegressionController],
    }).compile();

    app = moduleFixture.createNestApplication();

    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(
      new ResponseInterceptor(),
      new ResponseValidationInterceptor(reflector),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("must return a successful payload wrapped in the standard envelope when matching schema", async () => {
    const response = await request(app.getHttpServer()).get(
      "/regression/schema-match",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { id: "user-1", name: "Regression User" },
      error: null,
      meta: null,
    });
  });

  it("must throw an error and prevent response when data violates the defined Zod schema", async () => {
    const response = await request(app.getHttpServer()).get(
      "/regression/schema-mismatch",
    );

    expect(response.status).toBe(500);
    // In a real app with GlobalExceptionFilter this would be wrapped, but the main goal is preventing invalid responses.
  });

  it("must allow passthrough of unknown data when using z.unknown()", async () => {
    const response = await request(app.getHttpServer()).get(
      "/regression/schema-passthrough",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { some: "dynamic", data: true },
      error: null,
      meta: null,
    });
  });
});
