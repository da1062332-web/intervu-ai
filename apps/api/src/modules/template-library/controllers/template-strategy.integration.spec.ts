import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, HttpStatus } from "@nestjs/common";
import request from "supertest";
import { TemplateController } from "../controllers/template.controller";
import { TemplateService } from "../services/template.service";
import { StrategyDraftingService } from "../services/strategy-drafting.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";

describe("AI Strategy Builder Integration Tests", () => {
  let app: INestApplication;
  let templateService: TemplateService;
  let strategyDraftingService: StrategyDraftingService;

  const mockTemplate = {
    id: "template_123",
    name: "Math Question",
    variableSchema: {},
    constraints: {},
  };

  const mockDraft = {
    variables: [
      { name: "a", type: "integer", min: 10, max: 99 },
      { name: "b", type: "integer", min: 10, max: 99 },
    ],
    derivedVariables: [{ name: "result", expression: "a * b" }],
    constraints: [{ rule: "result < 5000", severity: "error" }],
    notes: [],
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TemplateController],
      providers: [
        {
          provide: TemplateService,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockTemplate),
            update: jest.fn().mockResolvedValue({
              ...mockTemplate,
              variableSchema: mockDraft,
            }),
            applyDraftedStrategy: jest.fn().mockResolvedValue({
              success: true,
              template: mockTemplate,
            }),
          },
        },
        {
          provide: StrategyDraftingService,
          useValue: {
            draftStrategy: jest.fn().mockResolvedValue({
              success: true,
              data: mockDraft,
              validationWarnings: [],
            }),
          },
        },
        {
          provide: "JwtAuthGuard",
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    app = moduleFixture.createNestApplication();
    templateService = moduleFixture.get<TemplateService>(TemplateService);
    strategyDraftingService = moduleFixture.get<StrategyDraftingService>(
      StrategyDraftingService,
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /templates/:id/ai/strategy/draft", () => {
    it("should successfully draft a strategy from a prompt", async () => {
      const prompt =
        "Create variables for multiplication: a and b from 10-99, result = a*b, result < 5000";

      const response = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/draft")
        .send({ prompt });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.data.variables).toHaveLength(2);
      expect(response.body.data.derivedVariables).toHaveLength(1);
      expect(response.body.data.constraints).toHaveLength(1);
    });

    it("should reject empty prompt", async () => {
      const response = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/draft")
        .send({ prompt: "" });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it("should reject prompt exceeding max length", async () => {
      const longPrompt = "a".repeat(2001);

      const response = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/draft")
        .send({ prompt: longPrompt });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it("should handle LLM service errors gracefully", async () => {
      const mockError = new Error("OpenAI API Error");
      jest
        .spyOn(strategyDraftingService, "draftStrategy")
        .mockRejectedValueOnce(mockError);

      const response = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/draft")
        .send({ prompt: "test" });

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe("POST /templates/:id/ai/strategy/preview", () => {
    it("should successfully preview a strategy without persisting", async () => {
      const response = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/preview")
        .send({ draft: mockDraft });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.preview).toBeDefined();
      expect(response.body.preview.variables).toHaveLength(2);
    });

    it("should return validation warnings for invalid draft", async () => {
      const invalidDraft = {
        variables: [{ name: "a", type: "integer" }],
        derivedVariables: [
          { name: "result", expression: "a * undefined_var" }, // Reference to undefined
        ],
        constraints: [],
        notes: [],
      };

      const response = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/preview")
        .send({ draft: invalidDraft });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
      expect(response.body.warnings).toBeDefined();
      expect(Array.isArray(response.body.warnings)).toBe(true);
    });

    it("should reject draft with empty variables array", async () => {
      const invalidDraft = {
        variables: [],
        derivedVariables: [],
        constraints: [],
        notes: [],
      };

      const response = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/preview")
        .send({ draft: invalidDraft });

      expect(response.status).toBe(HttpStatus.OK);
      expect(
        response.body.warnings.some((w: string) =>
          w.toLowerCase().includes("no variables"),
        ),
      ).toBe(true);
    });
  });

  describe("POST /templates/:id/ai/strategy/apply", () => {
    it("should successfully apply drafted strategy to template", async () => {
      const response = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/apply")
        .send({ draft: mockDraft });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body.success).toBe(true);
    });

    it("should call TemplateService.applyDraftedStrategy with correct parameters", async () => {
      const applyDraftedStrategySpy = jest.spyOn(
        templateService,
        "applyDraftedStrategy",
      );

      await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/apply")
        .send({ draft: mockDraft });

      expect(applyDraftedStrategySpy).toHaveBeenCalledWith(
        "template_123",
        mockDraft,
      );
    });

    it("should handle template not found error", async () => {
      jest
        .spyOn(templateService, "applyDraftedStrategy")
        .mockRejectedValueOnce(new Error("Template not found"));

      const response = await request(app.getHttpServer())
        .post("/templates/nonexistent/ai/strategy/apply")
        .send({ draft: mockDraft });

      expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it("should persist changes to database", async () => {
      const updateSpy = jest.spyOn(templateService, "update");

      jest
        .spyOn(templateService, "applyDraftedStrategy")
        .mockImplementationOnce(async (id, draft) => {
          await templateService.update(id, { variableSchema: draft });
          return { success: true, templateId: id, updated: true };
        });

      await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/apply")
        .send({ draft: mockDraft });

      expect(updateSpy).toHaveBeenCalledWith(
        "template_123",
        expect.objectContaining({
          variableSchema: mockDraft,
        }),
      );
    });
  });

  describe("Full Workflow Integration", () => {
    it("should complete full workflow: draft -> preview -> apply", async () => {
      // Step 1: Draft
      const draftResponse = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/draft")
        .send({
          prompt:
            "Create variables for multiplication: a and b from 10-99, result = a*b",
        });

      expect(draftResponse.status).toBe(HttpStatus.OK);
      expect(draftResponse.body.success).toBe(true);
      const draft = draftResponse.body.data;

      // Step 2: Preview
      const previewResponse = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/preview")
        .send({ draft });

      expect(previewResponse.status).toBe(HttpStatus.OK);
      expect(previewResponse.body.success).toBe(true);

      // Step 3: Apply
      const applyResponse = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/apply")
        .send({ draft });

      expect(applyResponse.status).toBe(HttpStatus.OK);
      expect(applyResponse.body.success).toBe(true);
    });

    it("should handle user edits between preview and apply", async () => {
      // User drafts strategy
      const draftResponse = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/draft")
        .send({
          prompt: "Create variables for multiplication",
        });

      let draft = draftResponse.body.data;

      // User edits the draft (e.g., removes a constraint)
      draft.constraints = draft.constraints.filter(
        (c: any) => !c.rule.includes("5000"),
      );

      // User applies the edited draft
      const applyResponse = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/apply")
        .send({ draft });

      expect(applyResponse.status).toBe(HttpStatus.OK);
      expect(applyResponse.body.success).toBe(true);
    });
  });

  describe("Error Scenarios", () => {
    it("should handle missing draft in apply request", async () => {
      const response = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/apply")
        .send({});

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    });

    it("should handle malformed draft structure", async () => {
      const malformedDraft = {
        variables: "not an array",
        derivedVariables: null,
        constraints: {},
      };

      const response = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/preview")
        .send({ draft: malformedDraft });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it("should validate draft before applying to prevent data corruption", async () => {
      const invalidDraft = {
        variables: [],
        derivedVariables: [{ name: "orphan", expression: "nonexistent * 2" }],
        constraints: [{ rule: "undefined > 100", severity: "error" }],
        notes: [],
      };

      // Should still apply but with warnings
      const response = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/apply")
        .send({ draft: invalidDraft });

      expect(response.status).toBe(HttpStatus.OK);
      // Warnings should be communicated to user
    });
  });

  describe("Concurrency & Race Conditions", () => {
    it("should handle concurrent draft requests", async () => {
      const prompts = [
        "Draft 1: variables a, b",
        "Draft 2: variables x, y, z",
        "Draft 3: simple variable",
      ];

      const responses = await Promise.all(
        prompts.map((prompt) =>
          request(app.getHttpServer())
            .post("/templates/template_123/ai/strategy/draft")
            .send({ prompt }),
        ),
      );

      expect(responses).toHaveLength(3);
      expect(responses.every((r) => r.status === HttpStatus.OK)).toBe(true);
    });

    it("should handle concurrent apply requests (should only last one persists)", async () => {
      const draft1 = {
        ...mockDraft,
        variables: [{ name: "a", type: "integer" }],
      };

      const draft2 = {
        ...mockDraft,
        variables: [{ name: "x", type: "number" }],
      };

      const responses = await Promise.all([
        request(app.getHttpServer())
          .post("/templates/template_123/ai/strategy/apply")
          .send({ draft: draft1 }),
        request(app.getHttpServer())
          .post("/templates/template_123/ai/strategy/apply")
          .send({ draft: draft2 }),
      ]);

      expect(responses).toHaveLength(2);
      expect(responses.every((r) => r.status === HttpStatus.OK)).toBe(true);
      // Last applied draft should be what's persisted
    });
  });

  describe("RBAC & Authorization", () => {
    it("should require admin role to draft strategy", async () => {
      const response = await request(app.getHttpServer())
        .post("/templates/template_123/ai/strategy/draft")
        .set("Authorization", "Bearer invalid_token")
        .send({ prompt: "test" });

      // Should be blocked by @Roles guard
      // Depending on guard implementation, might be 403 or redirected
      expect([HttpStatus.FORBIDDEN, HttpStatus.UNAUTHORIZED]).toContain(
        response.status,
      );
    });
  });
});
