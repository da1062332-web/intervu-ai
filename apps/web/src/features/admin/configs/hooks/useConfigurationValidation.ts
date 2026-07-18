import { useQuery } from '@tanstack/react-query';
import { examConfigsApi } from '@/services/exam-configs/api';
import { ValidationResult } from '../utils/validationEngine';

export function useConfigurationValidation(configId: string) {
  return useQuery({
    queryKey: ['config-validation', configId],
    queryFn: async (): Promise<ValidationResult> => {
      if (!configId) {
        return { valid: false, readiness: 0, errors: [], warnings: [] };
      }

      try {
        const [preview, validation, config] = await Promise.all([
          examConfigsApi.previewConfig(configId),
          examConfigsApi.validateConfig(configId),
          examConfigsApi.getConfig(configId).catch(() => null), // fail gracefully
        ]);

        const errors: string[] = [...(validation.errors || [])];
        const warnings: string[] = [...(validation.warnings || [])];
        let readinessPoints = 100;

        // Apply backend structural/dependency check errors
        if (validation.dependencyCheck?.errors) {
          const depErrors = validation.dependencyCheck.errors.filter(e => !e.toLowerCase().includes('no active templates') && !e.toLowerCase().includes('no templates'));
          errors.push(...depErrors);
        }
        if (validation.dependencyCheck?.warnings) {
          const depWarnings = validation.dependencyCheck.warnings.filter(w => !w.toLowerCase().includes('no active templates') && !w.toLowerCase().includes('no templates'));
          warnings.push(...depWarnings);
        }

        if (errors.length > 0) {
          readinessPoints -= Math.min(60, errors.length * 20); // deduct heavily for errors
        }

        // Additional checks from preview
        if (preview.sections === 0) {
          errors.push('No sections have been configured.');
          readinessPoints -= 20;
        }

        if (preview.totalTopics === 0) {
          errors.push('No topics have been assigned to any sections.');
          readinessPoints -= 20;
        } else if (!preview.conceptCodes || preview.conceptCodes.length === 0) {
          warnings.push('No concepts have been mapped to topics.');
          readinessPoints -= 10;
        }

        const totalQuestionsMatch = 
          !warnings.some(w => w.toLowerCase().includes('does not match exam total questions')) &&
          !errors.some(e => e.toLowerCase().includes('does not match exam total questions'));

        const hasBlueprintError = errors.some(e => e.toLowerCase().includes('blueprint'));

        const checklist = {
          generalInformation: !!config?.name && !!config?.durationMinutes && !!config?.totalQuestions,
          sectionsCreated: preview.sections > 0,
          topicsAssigned: preview.totalTopics > 0,
          conceptsAvailable: (preview.conceptCodes?.length ?? 0) > 0,
          templatesCreated: (preview.conceptCodes?.length ?? 0) > 0,
          difficultyConfigured: !errors.some(e => e.toLowerCase().includes('difficulty')),
          rulesConfigured: !errors.some(e => e.toLowerCase().includes('rules')),
          rolesConfigured: !errors.some(e => e.toLowerCase().includes('roles')),
          blueprintComplete: !hasBlueprintError && ((preview as any).blueprintId || (config as any)?.blueprintId) ? true : false,
          totalQuestionsMatch,
        };

        // Calculate readiness score dynamically based on checklist
        const checks = Object.values(checklist);
        const passedChecks = checks.filter(Boolean).length;
        const finalReadiness = Math.round((passedChecks / checks.length) * 100);

        // Deduplicate errors and warnings
        const uniqueErrors = Array.from(new Set(errors));
        const uniqueWarnings = Array.from(new Set(warnings));

        return {
          valid: uniqueErrors.length === 0,
          readiness: finalReadiness,
          errors: uniqueErrors,
          warnings: uniqueWarnings,
          checklist,
        };
      } catch (error) {
        console.error('Validation failed:', error);
        return {
          valid: false,
          readiness: 0,
          errors: ['Failed to perform readiness validation due to a network error.'],
          warnings: [],
        };
      }
    },
    enabled: !!configId,
    staleTime: 0, 
    refetchInterval: 3000, // Refresh every 3 seconds to ensure readiness stays up to date
  });
}
