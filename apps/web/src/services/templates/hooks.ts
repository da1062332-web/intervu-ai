import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as templateApi from './api';
import type { 
  CreateSolutionTemplateRequest, 
  UpdateSolutionTemplateRequest, 
  GenerateTemplatePreviewRequest 
} from '@intervu/shared';

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
    mutationFn: ({ templateId, payload, isUpdate }: { templateId: string, payload: CreateSolutionTemplateRequest | UpdateSolutionTemplateRequest, isUpdate: boolean }) => 
      isUpdate 
        ? templateApi.updateSolutionTemplate(templateId, payload)
        : templateApi.createSolutionTemplate(templateId, payload as CreateSolutionTemplateRequest),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['solutionTemplate', variables.templateId] });
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
    mutationFn: ({ templateId, payload }: { templateId: string, payload: GenerateTemplatePreviewRequest }) => 
      templateApi.generatePreview(templateId, payload),
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
