import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TemplateBuilderPageClient } from '../app/admin/templates/[id]/TemplateBuilderPageClient';
import * as templatesHooks from '@/services/templates/hooks';
import { VariableType } from '@intervu/shared/enums';

vi.mock('@/services/templates/hooks', () => ({
  useTemplateVariables: vi.fn(),
  useTemplateRules: vi.fn(),
  useCreateVariable: vi.fn(),
  useUpdateVariable: vi.fn(),
  useDeleteVariable: vi.fn(),
  useCreateRule: vi.fn(),
  useUpdateRule: vi.fn(),
  useDeleteRule: vi.fn(),
  useValidateTemplate: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SchemaPreview UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(templatesHooks.useTemplateVariables).mockReturnValue({
      data: [
        {
          id: 'v1',
          templateId: 't1',
          variableName: 'port',
          variableType: VariableType.NUMBER,
          required: true,
          defaultValue: '8080',
        },
      ],
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof templatesHooks.useTemplateVariables>);

    vi.mocked(templatesHooks.useTemplateRules).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof templatesHooks.useTemplateRules>);

    vi.mocked(templatesHooks.useValidateTemplate).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
    } as unknown as ReturnType<typeof templatesHooks.useValidateTemplate>);
  });

  it('renders schema preview panel with correct headers', () => {
    render(<TemplateBuilderPageClient templateId='t1' />);
    expect(screen.getByText('Schema Preview')).toBeInTheDocument();
  });
});
