import { ConceptMapping } from '@/services/concept-mapping';
import { SectionTopicResponse } from '@intervu-ai/contracts';
import { TopicWeightage } from '@/services/topic-weightages/api';

export interface ValidationState {
  topics: SectionTopicResponse[];
  conceptsByTopic: Record<string, ConceptMapping[]>;
  templatesByConcept: Record<string, any[]>; // For now, any array of templates
  weightages: TopicWeightage[];
}

export interface ValidationResult {
  valid: boolean;
  readiness: number; // 0 to 100
  errors: string[];
  warnings: string[];
  checklist?: {
    sectionsCreated: boolean;
    topicsAssigned: boolean;
    conceptsAvailable: boolean;
    templatesCreated: boolean;
    difficultyConfigured: boolean;
    rulesConfigured: boolean;
    blueprintComplete: boolean;
    totalQuestionsMatch: boolean;
  };
}

export function validateConfiguration(state: ValidationState): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let readinessPoints = 0;
  const TOTAL_POINTS = 100;
  let maxPoints = 0; // Will sum up max possible points

  // 1. Topics exist (20 points)
  maxPoints += 20;
  if (!state.topics || state.topics.length === 0) {
    errors.push('No topics have been assigned to this configuration.');
  } else {
    readinessPoints += 20;
    
    // Check if each topic has at least one concept
    let allTopicsHaveConcepts = true;
    for (const topic of state.topics) {
      const concepts = state.conceptsByTopic[topic.topicId];
      if (!concepts || concepts.length === 0) {
        allTopicsHaveConcepts = false;
        warnings.push(`Topic "${(topic as any).topicName || topic.topicId}" has no concepts mapped.`);
      }
    }
  }

  // 2. Concepts mapped (30 points)
  maxPoints += 30;
  let totalConcepts = 0;
  let activeConcepts = 0;
  
  Object.values(state.conceptsByTopic).forEach(concepts => {
    totalConcepts += concepts.length;
    activeConcepts += concepts.filter(c => c.status === 'ACTIVE' || c.isActive).length;
  });

  if (totalConcepts === 0) {
    if (state.topics.length > 0) {
      errors.push('No concepts are defined for the selected topics.');
    }
  } else if (activeConcepts === 0) {
    errors.push('No ACTIVE concepts found. At least one concept must be active.');
  } else {
    readinessPoints += 30;
  }

  // 3. Templates Assigned (30 points)
  maxPoints += 30;
  let anyConceptHasTemplate = false;
  let conceptsWithoutTemplates = 0;

  Object.entries(state.conceptsByTopic).forEach(([topicId, concepts]) => {
    concepts.forEach(concept => {
      // In this mocked environment, we might not have full template tracking globally yet,
      // but the UI will supply templatesByConcept if loaded.
      const templates = state.templatesByConcept[concept.id];
      if (templates && templates.length > 0) {
        anyConceptHasTemplate = true;
      } else if (concept.status === 'ACTIVE' || concept.isActive) {
        conceptsWithoutTemplates++;
      }
    });
  });

  if (activeConcepts > 0 && !anyConceptHasTemplate) {
    warnings.push('No templates have been assigned to any concepts. Generation will fallback to defaults or fail.');
  } else if (anyConceptHasTemplate) {
    readinessPoints += 30;
    if (conceptsWithoutTemplates > 0) {
      warnings.push(`${conceptsWithoutTemplates} active concept(s) have no templates mapped.`);
    }
  }

  // 4. Weightages configured (20 points)
  maxPoints += 20;
  if (!state.weightages || state.weightages.length === 0) {
    if (state.topics.length > 0) {
      errors.push('Topic weightages are missing. Please configure weightages.');
    }
  } else {
    let totalPercentage = 0;
    state.weightages.forEach(w => {
      totalPercentage += w.weightagePercentage || 0;
    });

    if (totalPercentage !== 100) {
      errors.push(`Topic weightages must total exactly 100%. Current total: ${totalPercentage}%.`);
    } else {
      readinessPoints += 20;
    }
  }

  const valid = errors.length === 0;
  const readiness = maxPoints > 0 ? Math.round((readinessPoints / maxPoints) * 100) : 0;

  return {
    valid,
    readiness,
    errors,
    warnings,
  };
}
