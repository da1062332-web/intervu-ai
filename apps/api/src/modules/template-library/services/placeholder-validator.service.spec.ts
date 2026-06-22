import { PlaceholderValidatorService } from './placeholder-validator.service';

describe('PlaceholderValidatorService', () => {
  let service: PlaceholderValidatorService;

  beforeEach(() => {
    service = new PlaceholderValidatorService();
  });

  it('should validate with allowed variables', () => {
    const template = 'The {{answer}} is {{difficulty}}';
    const allowed = ['difficulty'];
    const result = service.validate(template, allowed);
    expect(result.valid).toBe(true);
    expect(result.unknownVariables).toEqual([]);
  });

  it('should reject unknown variables', () => {
    const template = 'The {{answer}} is {{unknown_var}} and {{another_bad}}';
    const allowed = ['difficulty'];
    const result = service.validate(template, allowed);
    expect(result.valid).toBe(false);
    expect(result.unknownVariables).toEqual(['unknown_var', 'another_bad']);
  });

  it('should allow default answer and explanation', () => {
    const template = '{{answer}} and {{explanation}}';
    const result = service.validate(template, []);
    expect(result.valid).toBe(true);
  });

  it('should invalidate when invalid_variable is parsed without payload', () => {
    const template = 'Correct answer {{invalid_variable}}';
    const result = service.validate(template, []);
    expect(result.valid).toBe(false);
    expect(result.unknownVariables).toEqual(['invalid_variable']);
  });
});
