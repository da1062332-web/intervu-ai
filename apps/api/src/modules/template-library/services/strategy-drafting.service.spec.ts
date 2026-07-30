import { Test, TestingModule } from '@nestjs/testing';
import { StrategyDraftingService } from './strategy-drafting.service';
import { StrategyCanonicalizationService } from './strategy-canonicalization.service';
import { AppLogger } from '@intervu-ai/shared-logger';

describe('StrategyDraftingService', () => {
  let service: StrategyDraftingService;
  let mockLLMAdapter: any;
  let mockLogger: any;

  beforeEach(async () => {
    // Mock LLM Adapter
    mockLLMAdapter = {
      generate: jest.fn(),
    };

    // Mock Logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategyDraftingService,
        {
          provide: 'LLM_ADAPTER',
          useValue: mockLLMAdapter,
        },
        {
          provide: AppLogger,
          useValue: mockLogger,
        },
        {
          provide: StrategyCanonicalizationService,
          useClass: StrategyCanonicalizationService,
        },
      ],
    }).compile();

    service = module.get<StrategyDraftingService>(StrategyDraftingService);
  });

  describe('draftStrategy', () => {
    it('should successfully draft a strategy from a valid prompt', async () => {
      const mockLLMResponse = JSON.stringify({
        variables: [
          { name: 'price', type: 'number', min: 100, max: 500 },
          { name: 'quantity', type: 'integer', min: 1, max: 20 },
        ],
        derivedVariables: [
          { name: 'total', expression: 'price * quantity' },
        ],
        constraints: [
          { rule: 'total % 100 == 0', severity: 'error' },
        ],
        notes: ['Derived total from price and quantity'],
      });

      mockLLMAdapter.generate.mockResolvedValue(mockLLMResponse);

      const result = await service.draftStrategy(
        'Create a question where price is between 100 and 500, quantity is 1-20, total = price * quantity'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.variables).toHaveLength(2);
      expect(result.data?.derivedVariables).toHaveLength(1);
      expect(result.data?.constraints).toHaveLength(1);
    });

    it('should reject empty prompts', async () => {
      await expect(service.draftStrategy('')).rejects.toThrow(
        'Prompt cannot be empty',
      );
    });

    it('should reject prompts exceeding max length', async () => {
      const longPrompt = 'a'.repeat(2001);

      await expect(service.draftStrategy(longPrompt)).rejects.toThrow(
        'Prompt exceeds 2000 character limit',
      );
    });

    it('should handle LLM API errors gracefully', async () => {
      mockLLMAdapter.generate.mockRejectedValue(
        new Error('OpenAI API error'),
      );

      await expect(service.draftStrategy('valid prompt')).rejects.toThrow(
        'Strategy drafting failed: OpenAI API error',
      );
    });

    it('should parse JSON from LLM response with markdown code blocks', async () => {
      const mockLLMResponse = `
        Here's your strategy:

        \`\`\`json
        {
          "variables": [
            { "name": "x", "type": "integer", "min": 1, "max": 10 }
          ],
          "derivedVariables": [],
          "constraints": [],
          "notes": []
        }
        \`\`\`

        This looks good!
      `;

      mockLLMAdapter.generate.mockResolvedValue(mockLLMResponse);

      const result = await service.draftStrategy('create a simple variable');

      expect(result.success).toBe(true);
      expect(result.data?.variables).toHaveLength(1);
      expect(result.data?.variables[0].name).toBe('x');
    });

    it('should parse JSON response even with extra surrounding text', async () => {
      const mockLLMResponse = `
        Here is the output:\n
        Some commentary before the JSON.
        {"variables":[{"name":"x","type":"number"}],"derivedVariables":[],"constraints":[],"notes":[]}
        Some trailing text that should be ignored.
      `;

      mockLLMAdapter.generate.mockResolvedValue(mockLLMResponse);

      const result = await service.draftStrategy('create a simple variable');

      expect(result.success).toBe(true);
      expect(result.data?.variables).toHaveLength(1);
      expect(result.data?.variables[0].name).toBe('x');
    });

    it('should return validation warnings for weak strategies', async () => {
      const mockLLMResponse = JSON.stringify({
        variables: [],
        derivedVariables: [],
        constraints: [],
        notes: [],
      });

      mockLLMAdapter.generate.mockResolvedValue(mockLLMResponse);

      const result = await service.draftStrategy('test prompt');

      expect(result.success).toBe(true);
      expect(result.validationWarnings).toBeDefined();
      expect(result.validationWarnings?.some((warning) => warning.toLowerCase().includes('no variables'))).toBe(true);
    });
  });

  describe('parseAndValidateResponse', () => {
    it('should extract JSON from raw LLM response', () => {
      const response = JSON.stringify({
        variables: [{ name: 'x', type: 'number' }],
        derivedVariables: [],
        constraints: [],
        notes: [],
      });

      const result = service['parseAndValidateResponse'](response);

      expect(result).toBeDefined();
      expect(result.variables).toHaveLength(1);
    });

    it('should throw on invalid JSON', () => {
      const invalidResponse = 'not valid json at all';

      expect(() => {
        service['parseAndValidateResponse'](invalidResponse);
      }).toThrow();
    });

    it('should treat missing optional arrays as empty', () => {
      const incompleteResponse = JSON.stringify({
        variables: [{ name: 'x', type: 'number' }],
      });

      const result = service['parseAndValidateResponse'](incompleteResponse);

      expect(result).toBeDefined();
      expect(result.variables).toHaveLength(1);
      expect(result.derivedVariables).toEqual([]);
      expect(result.constraints).toEqual([]);
      expect(result.notes).toEqual([]);
    });
  });

  describe('normalizeStrategy', () => {
    it('should normalize variable types to lowercase', () => {
      const raw: any = {
        variables: [
          { name: 'x', type: 'NUMBER', min: 1, max: 10 },
          { name: 'y', type: 'String', min: undefined, max: undefined },
        ],
        derivedVariables: [],
        constraints: [],
        notes: [],
      };

      const normalized = service['normalizeStrategy'](raw);

      expect(normalized.variables[0].type).toBe('number');
      expect(normalized.variables[1].type).toBe('string');
    });

    it('should trim variable names', () => {
      const raw: any = {
        variables: [
          { name: '  price  ', type: 'number', min: 100, max: 500 },
        ],
        derivedVariables: [],
        constraints: [],
        notes: [],
      };

      const normalized = service['normalizeStrategy'](raw);

      expect(normalized.variables[0].name).toBe('price');
    });

    it('should ensure constraints array has max 100 items', () => {
      const raw: any = {
        variables: [],
        derivedVariables: [],
        constraints: Array.from({ length: 150 }, (_, i) => ({
          rule: `constraint_${i}`,
          severity: 'error',
        })),
        notes: [],
      };

      const normalized = service['normalizeStrategy'](raw);

      expect(normalized.constraints).toHaveLength(100);
    });

    it('should remove duplicate variable names, keeping first occurrence', () => {
      const raw: any = {
        variables: [
          { name: 'x', type: 'number', min: 1, max: 10 },
          { name: 'x', type: 'integer', min: 0, max: 5 }, // Duplicate
          { name: 'y', type: 'string' },
        ],
        derivedVariables: [],
        constraints: [],
        notes: [],
      };

      const normalized = service['normalizeStrategy'](raw);

      expect(normalized.variables).toHaveLength(2);
      expect(normalized.variables[0].type).toBe('number'); // First occurrence
      expect(normalized.variables[1].name).toBe('y');
    });

    it('should convert number strings to proper types', () => {
      const raw: any = {
        variables: [
          {
            name: 'price',
            type: 'number',
            min: '100',
            max: '500',
            defaultValue: '250',
          },
        ],
        derivedVariables: [],
        constraints: [],
        notes: [],
      };

      const normalized = service['normalizeStrategy'](raw);

      expect(typeof normalized.variables[0].min).toBe('number');
      expect(typeof normalized.variables[0].max).toBe('number');
      expect(typeof normalized.variables[0].defaultValue).toBe('number');
      expect(normalized.variables[0].min).toBe(100);
    });
  });

  describe('collectWarnings', () => {
    it('should warn about derived variables referencing non-existent base variables', () => {
      const strategy = {
        variables: [{ name: 'x', type: 'number' }],
        derivedVariables: [
          { name: 'y', expression: 'x * z' }, // z doesn't exist
        ],
        constraints: [],
        notes: [],
      };

      const warnings = service['collectWarnings'](strategy as any);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('z');
    });

    it('should warn about constraints with missing target variables', () => {
      const strategy = {
        variables: [{ name: 'x', type: 'number' }],
        derivedVariables: [],
        constraints: [
          { rule: 'y > 10', severity: 'error' }, // y doesn't exist
        ],
        notes: [],
      };

      const warnings = service['collectWarnings'](strategy as any);

      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should not warn about valid strategies', () => {
      const strategy = {
        variables: [
          { name: 'x', type: 'number' },
          { name: 'y', type: 'number' },
        ],
        derivedVariables: [{ name: 'z', expression: 'x + y' }],
        constraints: [{ rule: 'z > 10', severity: 'error' }],
        notes: [],
      };

      const warnings = service['collectWarnings'](strategy as any);

      expect(warnings.length).toBe(0);
    });

    it('should warn if no variables are defined', () => {
      const strategy = {
        variables: [],
        derivedVariables: [{ name: 'y', expression: 'x * 2' }],
        constraints: [],
        notes: [],
      };

      const warnings = service['collectWarnings'](strategy as any);

      expect(warnings.some((w) => w.toLowerCase().includes('no variables'))).toBe(
        true
      );
    });

    it('should warn if both derived variables and constraints reference undefined vars', () => {
      const strategy = {
        variables: [],
        derivedVariables: [],
        constraints: [{ rule: 'undefined_var > 0', severity: 'error' }],
        notes: [],
      };

      const warnings = service['collectWarnings'](strategy as any);

      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe('canonical validation', () => {
    it('rejects natural-language constraint rules', async () => {
      const mockLLMResponse = JSON.stringify({
        variables: [{ name: 'avgRamMohan', type: 'number' }],
        derivedVariables: [],
        constraints: [{ rule: 'avgRamMohan is an integer', severity: 'critical' }],
        notes: [],
      });

      mockLLMAdapter.generate.mockResolvedValue(mockLLMResponse);

      await expect(service.draftStrategy('test')).rejects.toThrow(/invalid constraint definitions|undefined identifier/i);
    });

    it('normalizes single equals in constraint rules to double equals', async () => {
      const mockLLMResponse = JSON.stringify({
        variables: [{ name: 'x', type: 'number' }],
        derivedVariables: [],
        constraints: [{ rule: 'x = 0', severity: 'critical' }],
        notes: [],
      });

      mockLLMAdapter.generate.mockResolvedValue(mockLLMResponse);

      const result = await service.draftStrategy('test');

      expect(result.success).toBe(true);
      expect(result.data?.constraints[0].rule).toBe('x == 0');
    });
  });

  describe('buildDraftingPrompt', () => {
    it('should include user prompt in the generated system prompt', () => {
      const userPrompt = 'Create variables for a pricing question';
      const systemPrompt = service['buildDraftingPrompt'](userPrompt);

      expect(systemPrompt).toContain(userPrompt);
    });

    it('should include JSON format requirements in system prompt', () => {
      const systemPrompt = service['buildDraftingPrompt']('test');

      expect(systemPrompt).toContain('JSON');
      expect(systemPrompt).toContain('variables');
      expect(systemPrompt).toContain('derivedVariables');
      expect(systemPrompt).toContain('constraints');
    });

    it('should explicitly require variable domains to use type/min/max', () => {
      const systemPrompt = service['buildDraftingPrompt']('test');

      expect(systemPrompt).toContain("Use 'variables' for base-domain requirements");
      expect(systemPrompt).toContain('type: "integer"');
      expect(systemPrompt).toContain('min: 10');
      expect(systemPrompt).toContain('max: 70');
    });

    it('should explicitly forbid English prose in constraints.rule', () => {
      const systemPrompt = service['buildDraftingPrompt']('test');

      expect(systemPrompt).toContain("Do NOT duplicate natural-language domain requirements inside 'constraints[].rule'");
      expect(systemPrompt).toContain("Invalid examples: 'ages are integers between 10 and 70', 'avgRamMohan is an integer'");
      expect(systemPrompt).toContain("Do NOT output 'avgRamMohan = (ram_age + mohan_age) / 2' inside 'expression'");
    });

    it('should guide derived expressions to use only mathematical RHS values', () => {
      const systemPrompt = service['buildDraftingPrompt']('test');

      expect(systemPrompt).toContain("Derived variables must use 'expression' only");
      expect(systemPrompt).toContain("Do NOT output 'avgRamMohan = (ram_age + mohan_age) / 2' inside 'expression'");
    });

    it('should use canonical equality examples with == for constraints', () => {
      const systemPrompt = service['buildDraftingPrompt']('test');

      expect(systemPrompt).toContain('totalCost == price * quantity');
      expect(systemPrompt).not.toContain("totalCost = price * quantity");
    });

    it('should include examples in system prompt', () => {
      const systemPrompt = service['buildDraftingPrompt']('test');

      expect(systemPrompt.length).toBeGreaterThan(500); // Substantial prompt with examples
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed constraint rules', async () => {
      const mockLLMResponse = JSON.stringify({
        variables: [{ name: 'x', type: 'number' }],
        derivedVariables: [],
        constraints: [
          { rule: null }, // Invalid rule
          { rule: 'x > 10', severity: 'error' }, // Valid
        ],
        notes: [],
      });

      mockLLMAdapter.generate.mockResolvedValue(mockLLMResponse);

      const result = await service.draftStrategy('test');

      expect(result.success).toBe(true);
      // Should filter out invalid constraints
      expect(result.data?.constraints.length).toBeLessThanOrEqual(1);
    });

    it('should handle missing severity in constraints', async () => {
      const mockLLMResponse = JSON.stringify({
        variables: [{ name: 'x', type: 'number' }],
        derivedVariables: [],
        constraints: [
          { rule: 'x > 10' }, // No severity field
        ],
        notes: [],
      });

      mockLLMAdapter.generate.mockResolvedValue(mockLLMResponse);

      const result = await service.draftStrategy('test');

      expect(result.success).toBe(true);
      // Should add default severity
      expect(result.data?.constraints[0].severity).toBeDefined();
    });

    it('should handle empty derived variable expressions', async () => {
      const mockLLMResponse = JSON.stringify({
        variables: [{ name: 'x', type: 'number' }],
        derivedVariables: [
          { name: 'y', expression: '' }, // Empty
          { name: 'z', expression: 'x * 2' }, // Valid
        ],
        constraints: [],
        notes: [],
      });

      mockLLMAdapter.generate.mockResolvedValue(mockLLMResponse);

      const result = await service.draftStrategy('test');

      expect(result.success).toBe(true);
      // Should filter out empty expressions
      expect(result.data?.derivedVariables.some((dv: any) => !dv.expression)).toBe(
        false
      );
    });
  });

  describe('Response Format', () => {
    it('should return success with data and warnings', async () => {
      const mockLLMResponse = JSON.stringify({
        variables: [{ name: 'x', type: 'number', min: 1, max: 10 }],
        derivedVariables: [],
        constraints: [],
        notes: [],
      });

      mockLLMAdapter.generate.mockResolvedValue(mockLLMResponse);

      const result = await service.draftStrategy('test');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('validationWarnings');
      expect(result.success).toBe(true);
    });

    it('should return error with message on failure', async () => {
      mockLLMAdapter.generate.mockRejectedValue(new Error('API Error'));

      await expect(service.draftStrategy('test')).rejects.toThrow(
        'Strategy drafting failed: API Error',
      );
    });
  });
});
