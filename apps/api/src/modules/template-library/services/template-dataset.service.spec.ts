import { Test, TestingModule } from "@nestjs/testing";
import { TemplateDatasetService } from "./template-dataset.service";
import { TemplateDatasetRepository } from "../repositories/template-dataset.repository";
import { TemplateRepository } from "../repositories/template.repository";

describe("TemplateDatasetService", () => {
  let service: TemplateDatasetService;

  const mockTemplateDatasetRepo = {
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
        TemplateDatasetService,
        {
          provide: TemplateDatasetRepository,
          useValue: mockTemplateDatasetRepo,
        },
        { provide: TemplateRepository, useValue: mockTemplateRepo },
      ],
    }).compile();

    service = module.get<TemplateDatasetService>(TemplateDatasetService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
