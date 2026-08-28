import {
  validateConfiguration,
  ValidationState,
  ValidationResult,
} from '../utils/validationEngine';
import { topicsApi, conceptsApi, templatesApi, weightagesApi } from './api';
import { SectionTopicResponse } from '@SkillitriX-ai/contracts';
import { ConceptMapping } from '@/services/concept-mapping';

export class ConfigurationReadinessService {
  /**
   * Fetches the entire state tree needed for configuration validation and validates it.
   * This bridges the gap between different APIs and the pure validation engine.
   */
  static async validate(
    sectionId: string,
    topics: SectionTopicResponse[],
  ): Promise<ValidationResult> {
    try {
      const state: ValidationState = {
        topics,
        conceptsByTopic: {},
        templatesByConcept: {},
        weightages: [],
      };

      // Fetch weightages
      if (sectionId) {
        state.weightages = await weightagesApi.getWeightages(sectionId);
      }

      // Fetch concepts and mock templates
      // In a real backend, we'd have a single endpoint to fetch readiness or bulk fetch.
      // Doing it in parallel to minimize waterfall.
      const conceptPromises = topics.map((topic) =>
        conceptsApi.getConcepts(topic.topicId).then((concepts) => ({
          topicId: topic.topicId,
          concepts,
        })),
      );

      const conceptsResults = await Promise.allSettled(conceptPromises);

      const allConcepts: ConceptMapping[] = [];

      conceptsResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          state.conceptsByTopic[result.value.topicId] = result.value.concepts;
          allConcepts.push(...result.value.concepts);
        }
      });

      // For the mock, we assume templates are fetched or mapped elsewhere.
      // If we had the real backend, we would fetch templates for allConcepts here.
      // For now, we simulate that any concept with "mock_has_templates" set in local storage has them,
      // or we just assume they don't have templates unless fetched.
      // To not overcomplicate the network in UI, we'll assume the hook passes the templates if needed,
      // or we do a quick fetch here if the API allows.

      return validateConfiguration(state);
    } catch (error) {
      console.error('Validation failed:', error);
      return {
        valid: false,
        readiness: 0,
        errors: ['Failed to perform readiness validation due to a network error.'],
        warnings: [],
      };
    }
  }
}
