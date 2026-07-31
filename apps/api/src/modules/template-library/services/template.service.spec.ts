import { BadRequestException } from '@nestjs/common';
import { TemplateService } from './template.service';
import type { PrismaService } from '../../../prisma/prisma.service';
import type { TemplateRepository } from '../repositories/template.repository';
import type { TemplateVariableRepository } from '../repositories/template-variable.repository';
import type { TemplateRuleRepository } from '../repositories/template-rule.repository';
import type { RedisCacheService } from '../../../cache';

describe('TemplateService AI strategy apply flow', () => {
  it('replaces strategy-owned variables and constraints while preserving unrelated legacy fields', async () => {
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
      { normalizeConstraintRule: (rule: string) => rule, validateDraft: () => ({ errors: [], warnings: [] }) } as any,
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
          variables: [expect.objectContaining({ name: 'price' })],
          derivedVariables: [expect.objectContaining({ name: 'total' })],
          formulas: ['total = price * 2'],
          generationStrategyConfig: expect.objectContaining({
            legacy: true,
            variables: [expect.objectContaining({ name: 'price' })],
            derivedVariables: [expect.objectContaining({ name: 'total' })],
            constraints: [expect.objectContaining({ rule: 'total < 200' })],
            formulas: ['total = price * 2'],
          }),
        }),
        constraints: expect.objectContaining({
          legacyKey: 'preserve-me-too',
          constraints: [expect.objectContaining({ rule: 'total < 200' })],
          rules: ['total < 200'],
          generationStrategyConfig: expect.objectContaining({
            legacy: true,
            variables: [expect.objectContaining({ name: 'price' })],
            derivedVariables: [expect.objectContaining({ name: 'total' })],
            constraints: [expect.objectContaining({ rule: 'total < 200' })],
            formulas: ['total = price * 2'],
          }),
        }),
      }),
    );

    expect(updatePayload.variableSchema.variables).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'legacyVar' })]),
    );
    expect(updatePayload.constraints.constraints).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ rule: 'legacyVar >= 1' })]),
    );
  });

  it('should generate a template question using solutionSchema.finalAnswer and persist the result', async () => {
    const templateRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'template_456',
        templateKey: 'template_456',
        difficultyLevel: 'MEDIUM',
        questionType: 'multiple_choice',
        conceptKey: 'concepts-1',
        version: 1,
        variableSchema: {
          variables: [
            { name: 'A', type: 'number', min: 2, max: 2 },
            { name: 'B', type: 'number', min: 3, max: 3 },
          ],
        },
        constraints: { constraints: [] },
        structure: {
          questionTemplate: 'What is {{A}} + {{B}}?',
          optionsTemplate: [],
        },
        solutionSchema: {
          finalAnswer: 'A + B',
        },
      }),
      update: jest.fn(),
    };

    const prismaMock = {
      solutionTemplate: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      generatedQuestion: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async (params) => {
          const data = params.data;
          return {
            id: 'generated_1',
            templateId: data.template.connect.id,
            conceptKey: data.conceptKey,
            questionText: data.questionText,
            options: data.options,
            correctAnswer: data.correctAnswer,
            solution: data.solution,
            metadata: data.metadata,
          };
        }),
      },
    };

    const cacheService = {
      invalidateTemplate: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    };

    const service = new TemplateService(
      prismaMock as any,
      templateRepository as any,
      {} as TemplateVariableRepository,
      {} as TemplateRuleRepository,
      cacheService as unknown as RedisCacheService,
      { normalizeConstraintRule: (rule: string) => rule, validateDraft: () => ({ errors: [], warnings: [] }) } as any,
    );

    const result = await service.generateQuestionForTemplate('template_456');

    expect(result.question.questionText).toBe('What is 2 + 3?');
    expect(result.answer).toBe('5');
    expect(result.question.options).toContain('5');
    expect(prismaMock.generatedQuestion.create).toHaveBeenCalled();
  });

  it('should reject invalid solutionSchema.finalAnswer on update', async () => {
    const templateRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'template_789',
        variableSchema: {
          variables: [{ name: 'X', type: 'number', min: 1, max: 10 }],
        },
        solutionSchema: {
          finalAnswer: 'X + 1',
        },
      }),
      update: jest.fn(),
    };

    const cacheService = {
      invalidateTemplate: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    };

    const service = new TemplateService(
      {} as PrismaService,
      templateRepository as any,
      {} as TemplateVariableRepository,
      {} as TemplateRuleRepository,
      cacheService as unknown as RedisCacheService,
      { normalizeConstraintRule: (rule: string) => rule, validateDraft: () => ({ errors: [], warnings: [] }) } as any,
    );

    await expect(
      service.update('template_789', {
        solutionSchema: { finalAnswer: 'unknownVar + 2' },
      }),
    ).rejects.toThrow(BadRequestException);
    expect(templateRepository.update).not.toHaveBeenCalled();
  });
});
