import { StrategyCanonicalizationService } from './strategy-canonicalization.service';

describe('StrategyCanonicalizationService', () => {
  let service: StrategyCanonicalizationService;

  beforeEach(() => {
    service = new StrategyCanonicalizationService();
  });

  it('accepts gcd in derived variable expressions', () => {
    const draft = {
      variables: [{ name: 'a', type: 'integer' }],
      derivedVariables: [{ name: 'd', expression: 'gcd(a, 2)' }],
      constraints: [],
    };

    const result = service.validateDraft(draft);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('accepts gcd in constraint rules', () => {
    const draft = {
      variables: [{ name: 'x', type: 'integer' }],
      derivedVariables: [],
      constraints: [{ rule: 'gcd(x, 3) == 1', severity: 'critical' }],
    };

    const result = service.validateDraft(draft);

    expect(result.errors).toHaveLength(0);
  });

  it('rejects unsupported MathJS functions in derived variables', () => {
    const draft = {
      variables: [{ name: 'a', type: 'integer' }],
      derivedVariables: [{ name: 'd', expression: 'unknownFn(a, 2)' }],
      constraints: [],
    };

    const result = service.validateDraft(draft);

    expect(result.errors).toContainEqual(
      expect.stringContaining('unsupported function(s): unknownFn'),
    );
  });

  it('detects undefined identifiers in constraint expressions', () => {
    const draft = {
      variables: [{ name: 'x', type: 'integer' }],
      derivedVariables: [],
      constraints: [{ rule: 'x + y > 0', severity: 'critical' }],
    };

    const result = service.validateDraft(draft);

    expect(result.errors).toContainEqual(
      expect.stringContaining('undefined identifier y'),
    );
  });
});
