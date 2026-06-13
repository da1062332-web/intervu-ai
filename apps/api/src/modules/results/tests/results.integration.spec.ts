import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { GlobalExceptionFilter } from "@intervu/shared";
import request from "supertest";
import { AppModule } from "../../../app.module";
import { PrismaService } from "../../../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

jest.setTimeout(30000);

describe("Results Integration (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let user: { id: string; email: string; role: string };
  let testRecord: { id: string };
  let evaluation: { id: string; userId: string };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Setup user
    user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        passwordHash: "hash",
      },
    });

    authToken = jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      type: "access",
      sessionId: "test-session",
    });

    const template = await prisma.template.create({
      data: { name: "Test Template" },
    });

    testRecord = await prisma.test.create({
      data: { userId: user.id, templateId: template.id },
    });

    // Setup evaluation
    evaluation = await prisma.evaluationResult.create({
      data: {
        userId: user.id,
        testId: testRecord.id,
        communicationScore: 80,
        technicalScore: 90,
        confidenceScore: 85,
        overallScore: 85,
        totalQuestions: 10,
        correctAnswers: 8,
        incorrectAnswers: 2,
        skillScores: {
          create: [{ skill: "React", score: 90, feedback: "Good" }],
        },
        recommendations: {
          create: [
            {
              skill: "TypeScript",
              priority: "HIGH",
              title: "Learn TS",
              description: "Important",
            },
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: user.id } });
    await app.close();
  });

  describe("GET /v1/results/:evaluationId", () => {
    it("should return result details", () => {
      return request(app.getHttpServer())
        .get(`/v1/results/${evaluation.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.data.overallScore).toBe(85);
        });
    });

    it("should return 403 for unauthorized access", async () => {
      const otherUser = await prisma.user.create({
        data: { email: `other-${Date.now()}@test.com`, passwordHash: "hash" },
      });
      const otherToken = jwtService.sign({
        sub: otherUser.id,
        email: otherUser.email,
        role: otherUser.role,
        type: "access",
        sessionId: "test-session-2",
      });

      await request(app.getHttpServer())
        .get(`/v1/results/${evaluation.id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(403);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe("GET /v1/results/:evaluationId/recommendations", () => {
    it("should return recommendations", () => {
      return request(app.getHttpServer())
        .get(`/v1/results/${evaluation.id}/recommendations`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.data[0].priority).toBe("HIGH");
        });
    });
  });

  describe("GET /v1/users/me/performance-summary", () => {
    it("should return performance summary", () => {
      return request(app.getHttpServer())
        .get("/v1/users/me/performance-summary")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.data.testsCompleted).toBeGreaterThanOrEqual(1);
          expect(res.body.data.averageScore).toBe(85);
        });
    });
  });

  describe("GET /v1/users/me/history", () => {
    it("should return paginated history", () => {
      return request(app.getHttpServer())
        .get("/v1/users/me/history")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res: request.Response) => {
          expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
          expect(res.body.data.total).toBeGreaterThanOrEqual(1);
        });
    });
  });
});
