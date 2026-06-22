import { Test, TestingModule } from '@nestjs/testing';
import { SolutionTemplateService } from './solution-template.service';
import { TemplateRendererService } from './template-renderer.service';
import { PlaceholderValidatorService } from './placeholder-validator.service';
import { SolutionTemplateRepository } from '../repositories/solution-template.repository';
import { TemplatePreviewRepository } from '../repositories/template-preview.repository';
import { TemplateRepository } from '../repositories/template.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('SolutionTemplateService', () => {
  let service: SolutionTemplateService;

  const mockPrisma = {
    templateVariable: {
      findMany: jest.fn().mockResolvedValue([{ variableName: 'var1' }]),
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
      ],
    }).compile();

    service = module.get<SolutionTemplateService>(SolutionTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
