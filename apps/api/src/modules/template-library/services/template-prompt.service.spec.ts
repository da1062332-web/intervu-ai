import { Test, TestingModule } from "@nestjs/testing";
import { TemplatePromptService } from "./template-prompt.service";
import { TemplatePromptRepository } from "../repositories/template-prompt.repository";
import { TemplateRepository } from "../repositories/template.repository";

describe("TemplatePromptService", () => {
  let service: TemplatePromptService;

  const mockTemplatePromptRepo = {
    findByTemplateId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockTemplateRepo = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatePromptService,
        { provide: TemplatePromptRepository, useValue: mockTemplatePromptRepo },
        { provide: TemplateRepository, useValue: mockTemplateRepo },
      ],
    }).compile();

    service = module.get<TemplatePromptService>(TemplatePromptService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
