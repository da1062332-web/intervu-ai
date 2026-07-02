import { RuntimeValidationService } from '../validation/runtime-validation.service';
import { RuntimeTestDto } from '../dto/runtime.dto';

describe('RuntimeValidationService', () => {
  let service: RuntimeValidationService;

  beforeEach(() => {
    service = new RuntimeValidationService();
  });

  it('should validate a valid test payload', () => {
    const validTest: RuntimeTestDto = {
      testId: 'test-123',
      title: 'Valid Test',
      duration: 3600,
      metadata: { source: 'blueprint' },
      sections: [
        {
          sectionId: 'sec-1',
          title: 'Aptitude',
          duration: 1800,
          questionCount: 1,
          questions: [
            {
              questionId: 'q-1',
              questionType: 'MULTIPLE_CHOICE',
              questionText: 'What is 2+2?',
              options: ['3', '4', '5'],
            },
          ],
        },
      ],
    };

    const result = service.validate(validTest);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should detect missing test ID', () => {
    const invalidTest = {
      title: 'Invalid',
      duration: 3600,
      metadata: {},
      sections: [],
    } as any;

    const result = service.validate(invalidTest);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Test ID is missing');
  });

  it('should detect negative duration and missing metadata', () => {
    const invalidTest: any = {
      testId: 'test-1',
      title: 'Negative Duration',
      duration: -100,
      sections: [],
    };

    const result = service.validate(invalidTest);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Negative Duration is not allowed for the test',
    );
    expect(result.errors).toContain('Missing Metadata at the test level');
    expect(result.errors).toContain('Section Count must be greater than zero');
  });

  it('should detect duplicate questions', () => {
    const invalidTest: RuntimeTestDto = {
      testId: 'test-2',
      title: 'Duplicate Q',
      duration: 60,
      metadata: {},
      sections: [
        {
          sectionId: 'sec-1',
          title: 'Sec 1',
          duration: 60,
          questionCount: 2,
          questions: [
            {
              questionId: 'q-dup',
              questionType: 'TEXT',
              questionText: 'Hello',
            },
            {
              questionId: 'q-dup',
              questionType: 'TEXT',
              questionText: 'World',
            },
          ],
        },
      ],
    };

    const result = service.validate(invalidTest);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Duplicate Questions found: q-dup');
  });
});
