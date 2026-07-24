import { TemplateService } from './template.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { TemplateRepository } from '../repositories/template.repository';
import { TemplateVariableRepository } from '../repositories/template-variable.repository';
import { TemplateRuleRepository } from '../repositories/template-rule.repository';
import { RedisCacheService } from '../../../cache';

describe('TemplateService AI strategy apply flow', () => {
  it('merges AI-drafted variables and constraints into the existing template schema instead of replacing legacy fields', async () => {
    const templateRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'template_123',
        variableSchema: {
          variables: [{ name: 'legacyVar', type: 'integer', min: 1, max: 10 }],
          derivedVariables: [{ name: 'legacyDerived', expression: 'legacyVar * 2' }],
          legacyKey: 'preserve-me',
          generationStrategyConfig: { legacy: true },
        },
        constraints: {
          constraints: [{ rule: 'legacyVar >= 1', severity: 'critical' }],
          legacyKey: 'preserve-me-too',
          generationStrategyConfig: { legacy: true },
        },
      }),
      update: jest.fn().mockResolvedValue({ id: 'template_123' }),
    };

    const cacheService = {
      invalidateTemplate: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    };

    const service = new TemplateService(
      {} as PrismaService,
      templateRepository as unknown as TemplateRepository,
      {} as TemplateVariableRepository,
      {} as TemplateRuleRepository,
      cacheService as unknown as RedisCacheService,
    );

    await service.applyDraftedStrategy('template_123', {
      variables: [{ name: 'price', type: 'integer', min: 10, max: 100 }],
      derivedVariables: [{ name: 'total', expression: 'price * 2' }],
      constraints: [{ rule: 'total < 200', severity: 'critical' }],
      notes: [],
    });

    const [, updatePayload] = templateRepository.update.mock.calls[0];

    expect(updatePayload).toEqual(
      expect.objectContaining({
        variableSchema: expect.objectContaining({
          legacyKey: 'preserve-me',
          variables: expect.arrayContaining([
            expect.objectContaining({ name: 'legacyVar' }),
            expect.objectContaining({ name: 'price' }),
          ]),
          derivedVariables: expect.arrayContaining([
            expect.objectContaining({ name: 'legacyDerived' }),
            expect.objectContaining({ name: 'total' }),
          ]),
        }),
        constraints: expect.objectContaining({
          legacyKey: 'preserve-me-too',
          constraints: expect.arrayContaining([
            expect.objectContaining({ rule: 'legacyVar >= 1' }),
            expect.objectContaining({ rule: 'total < 200' }),
          ]),
        }),
      }),
    );
  });
});
