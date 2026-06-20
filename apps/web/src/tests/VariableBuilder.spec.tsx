import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';
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

describe('VariableBuilder UI', () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  const mockCreateVar = vi.fn();

  const mockDeleteVar = vi.fn();

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

    vi.mocked(templatesHooks.useCreateVariable).mockReturnValue({
      mutateAsync: mockCreateVar,
    } as unknown as ReturnType<typeof templatesHooks.useCreateVariable>);

    vi.mocked(templatesHooks.useDeleteVariable).mockReturnValue({
      mutateAsync: mockDeleteVar,
    } as unknown as ReturnType<typeof templatesHooks.useDeleteVariable>);

    vi.mocked(templatesHooks.useValidateTemplate).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ valid: true, errors: [] }),
    } as unknown as ReturnType<typeof templatesHooks.useValidateTemplate>);
  });

  it('renders variables list successfully', () => {
    render(<TemplateBuilderPageClient templateId='t1' />);
    expect(screen.getByText('port')).toBeInTheDocument();
    expect(screen.getByText('NUMBER')).toBeInTheDocument();
    expect(screen.getByText('8080')).toBeInTheDocument();
  });

  it('opens create variable modal when clicking Add Variable', () => {
    render(<TemplateBuilderPageClient templateId='t1' />);
    const addBtn = screen.getByRole('button', { name: /Add Variable/i });
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: 'Create Variable' })).toBeInTheDocument();
  });
});
