import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { datasetsApi, CreateDatasetPayload, UpdateDatasetPayload, CreateDatasetItemPayload } from './api';

const QUERY_KEY = 'datasets';

export const useDatasets = () =>
  useQuery({ queryKey: [QUERY_KEY], queryFn: datasetsApi.getAll });

export const useDataset = (id: string) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => datasetsApi.getById(id),
    enabled: !!id,
  });

export const useCreateDataset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDatasetPayload) => datasetsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useUpdateDataset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDatasetPayload }) =>
      datasetsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useDeleteDataset = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => datasetsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useAddDatasetItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ datasetId, payload }: { datasetId: string; payload: CreateDatasetItemPayload }) =>
      datasetsApi.addItem(datasetId, payload),
    onSuccess: (_, { datasetId }) =>
      qc.invalidateQueries({ queryKey: [QUERY_KEY, datasetId] }),
  });
};

export const useBulkAddDatasetItems = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ datasetId, payload }: { datasetId: string; payload: CreateDatasetItemPayload[] }) =>
      datasetsApi.bulkAddItems(datasetId, payload),
    onSuccess: (_, { datasetId }) =>
      qc.invalidateQueries({ queryKey: [QUERY_KEY, datasetId] }),
  });
};

export const useDeleteDatasetItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, datasetId }: { itemId: string; datasetId: string }) => 
      datasetsApi.deleteItem(itemId),
    onSuccess: (_, { datasetId }) =>
      qc.invalidateQueries({ queryKey: [QUERY_KEY, datasetId] }),
  });
};
