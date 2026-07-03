import { Test, TestingModule } from '@nestjs/testing';
import { RuntimeSecurityService } from '../services/runtime-security.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('RuntimeSecurityService', () => {
  let service: RuntimeSecurityService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuntimeSecurityService,
        {
          provide: PrismaService,
          useValue: {
            assembledTest: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RuntimeSecurityService>(RuntimeSecurityService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should allow published and active runtime', async () => {
    (prisma.assembledTest.findUnique as jest.Mock).mockResolvedValue({
      id: 'valid-test',
      status: 'PUBLISHED',
      examConfig: {
        isArchived: false,
        isActive: true,
      },
    });

    const result = await service.validateAccess('valid-test');
    expect(result).toBe(true);
  });

  it('should throw if runtime does not exist', async () => {
    (prisma.assembledTest.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.validateAccess('invalid-test')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should throw if runtime is archived', async () => {
    (prisma.assembledTest.findUnique as jest.Mock).mockResolvedValue({
      status: 'ARCHIVED',
    });

    await expect(service.validateAccess('archived-test')).rejects.toThrow(
      'Runtime is archived',
    );
  });
});
