import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { TemplateBuilderPageClient } from '../app/admin/templates/[id]/TemplateBuilderPageClient';
import * as templatesHooks from '@/services/templates/hooks';
import { VariableType, RuleType } from '@intervu/shared/enums';

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

describe('RuleBuilder UI', () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

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
      data: [
        {
          id: 'r1',
          templateId: 't1',
          ruleType: RuleType.RANGE,
          ruleConfig: {
            variableName: 'port',
            min: 1000,
            max: 9999,
          },
        },
      ],
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof templatesHooks.useTemplateRules>);

    vi.mocked(templatesHooks.useCreateRule).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof templatesHooks.useCreateRule>);

    vi.mocked(templatesHooks.useValidateTemplate).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
    } as unknown as ReturnType<typeof templatesHooks.useValidateTemplate>);
  });

  it('renders rules list successfully', () => {
    render(<TemplateBuilderPageClient templateId='t1' />);
    expect(screen.getByText('RANGE')).toBeInTheDocument();
    expect(screen.getAllByText('port')[0]).toBeInTheDocument();
  });

  it('opens rule builder modal when clicking Add Rule', () => {
    render(<TemplateBuilderPageClient templateId='t1' />);
    const addBtn = screen.getByRole('button', { name: /Add Rule/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: 'Add Rule' })).toBeInTheDocument();
  });
});
