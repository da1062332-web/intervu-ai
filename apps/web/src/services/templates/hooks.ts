import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi } from './api';
import type {
  CreateVariablePayload,
  UpdateVariablePayload,
  CreateRulePayload,
  UpdateRulePayload,
} from './api';

export const templateKeys = {
  all: ['templates'] as const,
  variables: (templateId: string) => ['template-variables', templateId] as const,
  rules: (templateId: string) => ['template-rules', templateId] as const,
  validation: (templateId: string) => ['template-validation', templateId] as const,
};

export function useTemplates(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: [...templateKeys.all, params],
    queryFn: () => templatesApi.getTemplates(params),
  });
}

export function useTemplateVariables(templateId: string) {
  return useQuery({
    queryKey: templateKeys.variables(templateId),
    queryFn: () => templatesApi.getVariables(templateId),
    enabled: !!templateId,
  });
}

export function useTemplateRules(templateId: string) {
  return useQuery({
    queryKey: templateKeys.rules(templateId),
    queryFn: () => templatesApi.getRules(templateId),
    enabled: !!templateId,
  });
}

export function useCreateVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: CreateVariablePayload }) =>
      templatesApi.createVariable(templateId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.variables(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.validation(variables.templateId) });
    },
  });
}

export function useUpdateVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      templateId: _templateId,
      payload,
    }: {
      id: string;
      templateId: string;
      payload: UpdateVariablePayload;
    }) => templatesApi.updateVariable(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.variables(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.validation(variables.templateId) });
    },
  });
}

export function useDeleteVariable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateId: _templateId }: { id: string; templateId: string }) =>
      templatesApi.deleteVariable(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.variables(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.rules(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.validation(variables.templateId) });
    },
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: CreateRulePayload }) =>
      templatesApi.createRule(templateId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.rules(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.validation(variables.templateId) });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      templateId: _templateId,
      payload,
    }: {
      id: string;
      templateId: string;
      payload: UpdateRulePayload;
    }) => templatesApi.updateRule(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.rules(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.validation(variables.templateId) });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateId: _templateId }: { id: string; templateId: string }) =>
      templatesApi.deleteRule(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.rules(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: templateKeys.validation(variables.templateId) });
    },
  });
}

export function useValidateTemplate() {
  return useMutation({
    mutationFn: ({ templateId, values }: { templateId: string; values: Record<string, unknown> }) =>
      templatesApi.validateTemplate(templateId, values),
  });
}
