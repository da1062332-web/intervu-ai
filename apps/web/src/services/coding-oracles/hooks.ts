import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCodingOracles,
  getCodingOracle,
  createCodingOracle,
  updateCodingOracle,
  toggleCodingOracleStatus,
  syncCodingOracles,
  testCodingOracle,
  CreateCodingOraclePayload,
  UpdateCodingOraclePayload,
  TestCodingOraclePayload,
} from './api';

export const CODING_ORACLES_KEY = ['coding-oracles'];

export const useCodingOracles = (
  category?: string,
  isActive?: boolean,
  search?: string,
  page = 1,
  limit = 50,
) => {
  return useQuery({
    queryKey: [...CODING_ORACLES_KEY, { category, isActive, search, page, limit }],
    queryFn: () => getCodingOracles(category, isActive, search, page, limit),
  });
};

export const useCodingOracle = (idOrKey: string) => {
  return useQuery({
    queryKey: [...CODING_ORACLES_KEY, idOrKey],
    queryFn: () => getCodingOracle(idOrKey),
    enabled: !!idOrKey,
  });
};

export const useCreateCodingOracle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCodingOraclePayload) => createCodingOracle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CODING_ORACLES_KEY });
    },
  });
};

export const useUpdateCodingOracle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idOrKey, payload }: { idOrKey: string; payload: UpdateCodingOraclePayload }) =>
      updateCodingOracle(idOrKey, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CODING_ORACLES_KEY });
    },
  });
};

export const useToggleCodingOracleStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idOrKey: string) => toggleCodingOracleStatus(idOrKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CODING_ORACLES_KEY });
    },
  });
};

export const useSyncCodingOracles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => syncCodingOracles(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CODING_ORACLES_KEY });
    },
  });
};

export const useTestCodingOracle = () => {
  return useMutation({
    mutationFn: ({ idOrKey, payload }: { idOrKey: string; payload: TestCodingOraclePayload }) =>
      testCodingOracle(idOrKey, payload),
  });
};
