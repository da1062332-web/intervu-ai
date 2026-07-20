import { Test, TestingModule } from "@nestjs/testing";
import { SolutionTemplateService } from "./solution-template.service";
import { TemplateRendererService } from "./template-renderer.service";
import { PlaceholderValidatorService } from "./placeholder-validator.service";
import { SolutionTemplateRepository } from "../repositories/solution-template.repository";
import { TemplatePreviewRepository } from "../repositories/template-preview.repository";
import { TemplateRepository } from "../repositories/template.repository";
import { PrismaService } from "../../../prisma/prisma.service";
import { GenerationRetryService } from "../../generation-ai/retry/generation-retry.service";

describe("SolutionTemplateService", () => {
  let service: SolutionTemplateService;

  const mockPrisma = {
    templateVariable: {
      findMany: jest.fn().mockResolvedValue([{ variableName: "var1" }]),
    },
  };

  const mockSolutionRepo = {
    findByTemplateId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockTemplateRepo = {
    findById: jest.fn(),
  };

  const mockPreviewRepo = {
    create: jest.fn(),
  };

  const mockRetryService = {
    generateFromTemplate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolutionTemplateService,
        TemplateRendererService,
        PlaceholderValidatorService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SolutionTemplateRepository, useValue: mockSolutionRepo },
        { provide: TemplatePreviewRepository, useValue: mockPreviewRepo },
        { provide: TemplateRepository, useValue: mockTemplateRepo },
        { provide: GenerationRetryService, useValue: mockRetryService },
      ],
    }).compile();

    service = module.get<SolutionTemplateService>(SolutionTemplateService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create a solution template when no existing record is found during update", async () => {
    mockSolutionRepo.findByTemplateId.mockResolvedValueOnce(null);
    mockTemplateRepo.findById.mockResolvedValue({ id: "template-1" });
    mockSolutionRepo.create.mockResolvedValue({
      id: "new-solution-template-id",
      solutionTemplate: "return value;",
      explanationTemplate: "Returns the value.",
    });

    await expect(
      service.updateSolutionTemplate("template-1", {
        solutionTemplate: "return value;",
        explanationTemplate: "Returns the value.",
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: "new-solution-template-id",
      }),
    );

    expect(mockSolutionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        solutionTemplate: "return value;",
        explanationTemplate: "Returns the value.",
        template: { connect: { id: "template-1" } },
      }),
    );
  });
});
