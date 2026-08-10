export class PatternPreviewResponseDto {
  parameters!: Record<string, any>;
  generatedInput!: Record<string, any>;
  expectedOutput!: Record<string, any>;
  publicTests!: Array<{
    input: any;
    expectedOutput: any;
    explanation?: string;
  }>;
  hiddenTests!: Array<{ input: any; expectedOutput: any }>;
  stressTests!: Array<{ input: any; expectedOutput: any }>;
  boundaryTests!: Array<{ input: any; expectedOutput: any }>;
  validation!: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  aiPreview?: {
    narrative: string;
    codeSkeletons?: Record<string, string> | null;
  }; // Reserved for Phase 3
}
