import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as templateApi from './api';
import type {
  CreateSolutionTemplateRequest,
  UpdateSolutionTemplateRequest,
  GenerateTemplatePreviewRequest,
} from '@intervu/shared';

export const useTemplates = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['templates', page, limit],
    queryFn: () => templateApi.getTemplates(page, limit),
  });
};

export const useTemplatesByConcept = (conceptKey: string, page = 1, limit = 100) => {
  return useQuery({
    queryKey: ['templatesByConcept', conceptKey, page, limit],
    queryFn: async () => {
      const response = await templateApi.getTemplates(page, limit, conceptKey);
      const items = response?.items || response?.data || [];
      const filtered = Array.isArray(items)
        ? items.filter((t: any) => t.conceptKey === conceptKey)
        : [];
      return {
        ...response,
        items: filtered,
        total: filtered.length,
      };
    },
    enabled: !!conceptKey,
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => templateApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useTemplate = (templateId: string) => {
  return useQuery({
    queryKey: ['template', templateId],
    queryFn: () => templateApi.getTemplate(templateId),
    enabled: !!templateId,
  });
};

export const useSolutionTemplate = (templateId: string) => {
  return useQuery({
    queryKey: ['solutionTemplate', templateId],
    queryFn: () => templateApi.getSolutionTemplate(templateId),
    enabled: !!templateId,
    retry: false, // Don't retry since 404 is expected for new templates
  });
};

export const useSaveSolutionTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      payload,
      isUpdate,
    }: {
      templateId: string;
      payload: CreateSolutionTemplateRequest | UpdateSolutionTemplateRequest;
      isUpdate: boolean;
    }) =>
      isUpdate
        ? templateApi.updateSolutionTemplate(templateId, payload)
        : templateApi.createSolutionTemplate(templateId, payload as CreateSolutionTemplateRequest),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['solutionTemplate', variables.templateId] });
      queryClient.invalidateQueries({ queryKey: ['template', variables.templateId] });
    },
  });
};

export const useTemplatePreview = (templateId: string) => {
  return useQuery({
    queryKey: ['templatePreview', templateId],
    queryFn: () => templateApi.getLatestPreview(templateId),
    enabled: !!templateId,
    retry: false,
  });
};

export const useGeneratePreview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: string;
      payload: GenerateTemplatePreviewRequest;
    }) => templateApi.generatePreview(templateId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templatePreview', variables.templateId] });
    },
  });
};

export const useTemplateVariables = (templateId: string) => {
  return useQuery({
    queryKey: ['templateVariables', templateId],
    queryFn: () => templateApi.getVariables(templateId),
    enabled: !!templateId,
  });
};

export const useTemplateRules = (templateId: string) => {
  return useQuery({
    queryKey: ['templateRules', templateId],
    queryFn: () => templateApi.getRules(templateId),
    enabled: !!templateId,
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: any }) =>
      templateApi.updateTemplate(templateId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template', variables.templateId] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });
};

export const useCreateVariable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: any }) =>
      templateApi.createVariable(templateId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templateVariables', variables.templateId] });
    },
  });
};

export const useSaveQuestionDefinition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: any }) =>
      templateApi.updateQuestionTemplate(templateId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template', variables.templateId] });
    },
  });
};

export const useSaveOptionStrategy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: any }) =>
      templateApi.updateOptionsTemplate(templateId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template', variables.templateId] });
    },
  });
};

export const useUpdateVariable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variableId, payload, templateId }: { variableId: string; payload: any; templateId: string }) =>
      templateApi.updateVariable(variableId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templateVariables', variables.templateId] });
    },
  });
};

export const useDeleteVariable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ variableId, templateId }: { variableId: string; templateId: string }) =>
      templateApi.deleteVariable(variableId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templateVariables', variables.templateId] });
    },
  });
};

export const useCreateRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: any }) =>
      templateApi.createRule(templateId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templateRules', variables.templateId] });
    },
  });
};

export const useUpdateRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, payload, templateId }: { ruleId: string; payload: any; templateId: string }) =>
      templateApi.updateRule(ruleId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templateRules', variables.templateId] });
    },
  });
};

export const useDeleteRule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, templateId }: { ruleId: string; templateId: string }) =>
      templateApi.deleteRule(ruleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templateRules', variables.templateId] });
    },
  });
};

export const useSaveTemplateDatasetConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: any }) =>
      templateApi.saveTemplateDatasetConfig(templateId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template', variables.templateId] });
    },
  });
};

export const useTemplateDatasetPreview = () => {
  return useMutation({
    mutationFn: (templateId: string) => templateApi.getTemplateDatasetPreview(templateId),
  });
};
