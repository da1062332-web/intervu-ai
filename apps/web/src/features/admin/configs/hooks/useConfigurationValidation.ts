import { useQuery } from '@tanstack/react-query';
import { ConfigurationReadinessService } from '../services/ConfigurationReadinessService';
import { examSectionsApi } from '@/services/exam-sections/api';
import { sectionTopicsApi } from '@/features/topic-section-mapping/api';
import { SectionTopicResponse } from '@intervu-ai/contracts';

export function useConfigurationValidation(configId: string) {
  return useQuery({
    queryKey: ['config-validation', configId],
    queryFn: async () => {
      // Fetch all sections for the config
      const sections = await examSectionsApi.getSections(configId);
      if (!sections || sections.length === 0) {
        // Fallback validation call with empty data
        return ConfigurationReadinessService.validate('', []);
      }

      // We aggregate topics from all sections
      const allTopics: SectionTopicResponse[] = [];
      let primarySectionId = sections[0].id; // Just for weightages for now

      for (const section of sections) {
        try {
          const res = await sectionTopicsApi.getSectionTopics(section.id);
          const topicsForSection = Array.isArray(res) ? res : (res as any)?.data || [];
          allTopics.push(...topicsForSection);
        } catch (e) {
          console.error('Failed to fetch topics for section', section.id);
        }
      }

      return ConfigurationReadinessService.validate(primarySectionId, allTopics);
    },
    enabled: !!configId,
    staleTime: 1000 * 30, // 30 seconds
  });
}
