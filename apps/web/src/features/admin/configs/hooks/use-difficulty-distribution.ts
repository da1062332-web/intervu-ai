import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { difficultyDistributionService } from '../services/difficulty-distribution.service';
import { UpdateDifficultyDistributionDto } from '@intervu/shared';

export const useDifficultyDistribution = (configId: string) => {
  return useQuery({
    queryKey: ['difficulty-distribution', configId],
    queryFn: () => difficultyDistributionService.getDifficultyDistribution(configId),
    enabled: !!configId,
  });
};

export const useUpdateDifficultyDistribution = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDifficultyDistributionDto) => 
      difficultyDistributionService.updateDifficultyDistribution(configId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['difficulty-distribution', configId] });
    },
  });
};
