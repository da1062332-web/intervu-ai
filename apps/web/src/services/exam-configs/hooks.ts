import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examConfigsApi } from './api';
import type { CreateConfigPayload, UpdateConfigPayload, ConfigValidationResult } from './types';
import { toast } from 'sonner';

export const useConfigs = () => {
  return useQuery({
    queryKey: ['configs'],
    queryFn: () => examConfigsApi.getConfigs(),
  });
};

export const useConfig = (configId: string) => {
  return useQuery({
    queryKey: ['configs', configId],
    queryFn: () => examConfigsApi.getConfig(configId),
    enabled: !!configId,
  });
};

export const useCreateConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConfigPayload) => examConfigsApi.createConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      toast.success('Exam configuration created successfully');
    },
    onError: () => {
      toast.error('Failed to create exam configuration');
    },
  });
};

export const useUpdateConfig = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateConfigPayload) => examConfigsApi.updateConfig(configId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['configs', configId] });
      toast.success('Exam configuration updated successfully');
    },
    onError: () => {
      toast.error('Failed to update exam configuration');
    },
  });
};

export const useArchiveConfig = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => examConfigsApi.archiveConfig(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['configs', configId] });
      toast.success('Exam configuration archived successfully');
    },
    onError: () => {
      toast.error('Failed to archive exam configuration');
    },
  });
};

// ─── Lifecycle Hooks ──────────────────────────────────────────────────────────

const VALIDATION_STORAGE_KEY = (id: string) => `config-validation-${id}`;

export const useValidateConfig = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => examConfigsApi.validateConfig(configId),
    onSuccess: (data) => {
      // Persist result so it survives page refresh
      try {
        sessionStorage.setItem(VALIDATION_STORAGE_KEY(configId), JSON.stringify(data));
      } catch (_) {
        /* non-blocking */
      }
      queryClient.setQueryData(['config-validation', configId], data);
      queryClient.invalidateQueries({ queryKey: ['configs', configId] });
      if (data.valid) {
        toast.success('Configuration validated successfully');
      } else {
        toast.error(`Validation failed: ${data.errors.length} error(s) found`);
      }
    },
    onError: () => {
      toast.error('Failed to run validation');
    },
  });
};

export const useConfigValidation = (configId: string) => {
  // Hydrate from sessionStorage on first render so validation survives page refresh
  const storedResult = React.useMemo<ConfigValidationResult | null>(() => {
    try {
      const raw = sessionStorage.getItem(`config-validation-${configId}`);
      return raw ? (JSON.parse(raw) as ConfigValidationResult) : null;
    } catch (_) {
      return null;
    }
  }, [configId]);

  return useQuery<ConfigValidationResult | null>({
    queryKey: ['config-validation', configId],
    queryFn: () => storedResult,
    initialData: storedResult,
    enabled: false, // Only manual population via validation mutation
  });
};

export const usePublishConfig = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => examConfigsApi.publishConfig(configId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['configs', configId] });
      queryClient.invalidateQueries({ queryKey: ['config-versions', configId] });
      toast.success(`Configuration published as ${data.version}`);
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || error?.message || 'Failed to publish configuration';
      toast.error(msg);
    },
  });
};

export const useConfigPreview = (configId: string) => {
  return useQuery({
    queryKey: ['config-preview', configId],
    queryFn: () => examConfigsApi.previewConfig(configId),
    enabled: !!configId,
    staleTime: 30_000,
  });
};

export const useConfigVersions = (configId: string) => {
  return useQuery({
    queryKey: ['config-versions', configId],
    queryFn: () => examConfigsApi.getVersions(configId),
    enabled: !!configId,
  });
};

export const useCreateVersion = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => examConfigsApi.createVersion(configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-versions', configId] });
      toast.success('Version snapshot created');
    },
    onError: () => {
      toast.error('Failed to create version snapshot');
    },
  });
};

export const useRestoreVersion = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (versionId: string) => examConfigsApi.restoreVersion(configId, versionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['configs', configId] });
      queryClient.invalidateQueries({ queryKey: ['config-versions', configId] });
      toast.success(data.message);
    },
    onError: () => {
      toast.error('Failed to restore version');
    },
  });
};
