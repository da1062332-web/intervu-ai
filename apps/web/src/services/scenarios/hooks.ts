import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scenariosApi, CreateScenarioPayload, UpdateScenarioPayload } from './api';

const QUERY_KEY = 'scenarios';

export const useScenarios = () =>
  useQuery({ queryKey: [QUERY_KEY], queryFn: scenariosApi.getAll });

export const useScenario = (id: string) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => scenariosApi.getById(id),
    enabled: !!id,
  });

export const useCreateScenario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateScenarioPayload) => scenariosApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useUpdateScenario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateScenarioPayload }) =>
      scenariosApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useDeleteScenario = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scenariosApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
