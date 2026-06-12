import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { AssemblyModule } from "./assembly.module";
import { PrismaModule } from "../../prisma/prisma.module";

describe("AssemblyIntegration", () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Basic setup for integration tests
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AssemblyModule, PrismaModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should initialize module", () => {
    expect(app).toBeDefined();
  });
});
