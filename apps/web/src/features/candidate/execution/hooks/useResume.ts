import { useEffect, useRef } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { executionService } from '../services/execution.service';

const STORAGE_KEY = 'SkillitriX_execution_autosave';

export function useResume(testId: string | undefined) {
  const { restoreStateFromStorage, testInstance, setAttemptedResume, hasAttemptedResume } =
    useExecutionStore();
  const resumedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    if (!testId || !testInstance || resumedRef.current || hasAttemptedResume) return;
    resumedRef.current = true;

    const resume = async () => {
      try {
        // Try backend resume first
        const sessionDto = await executionService.resumeAssessment(testId);

        if (!mounted) return;

        if (sessionDto && (sessionDto as any).answers) {
          const formattedAnswers = ((sessionDto as any).answers as any[]).reduce(
            (acc: any, ans: any) => {
              if (!ans || !ans.questionId) return acc;

              let selectedOptionId: string | undefined;
              let selectedOptionIds: string[] | undefined;
              let textResponse: string | undefined;

              const raw = ans.answer;

              if (Array.isArray(raw)) {
                selectedOptionIds = raw.map(String);
              } else if (typeof raw === 'object' && raw !== null) {
                textResponse = JSON.stringify(raw);
              } else if (typeof raw === 'string') {
                const trimmed = raw.trim();
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                  try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                      selectedOptionIds = parsed.map(String);
                    } else {
                      selectedOptionId = trimmed;
                    }
                  } catch {
                    selectedOptionId = trimmed;
                  }
                } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                  textResponse = trimmed;
                } else if (trimmed.startsWith('opt-') || /^[A-Da-d]$/.test(trimmed)) {
                  selectedOptionId = trimmed;
                } else {
                  textResponse = trimmed;
                  selectedOptionId = trimmed;
                }
              } else if (typeof raw === 'number' || typeof raw === 'boolean') {
                textResponse = String(raw);
              }

              const hasAnswer = Boolean(
                selectedOptionId ||
                (selectedOptionIds && selectedOptionIds.length > 0) ||
                (textResponse && textResponse !== '')
              );

              acc[ans.questionId] = {
                status: ans.isMarkedForReview
                  ? 'MARKED_FOR_REVIEW'
                  : hasAnswer
                    ? 'ANSWERED'
                    : 'UNANSWERED',
                selectedOptionId,
                selectedOptionIds,
                textResponse,
                timeSpentSeconds: ans.timeSpentSeconds || 0,
              };
              return acc;
            },
            {},
          );

          restoreStateFromStorage({
            answers: formattedAnswers,
            currentQuestionIndex:
              sessionDto.executionState?.currentQuestionIndex ?? sessionDto.currentQuestion ?? 0,
            remainingTime:
              sessionDto.executionState?.remainingTimeSeconds ??
              (sessionDto as any).remainingTime ??
              testInstance.durationSeconds,
            currentSectionIndex: sessionDto.executionState?.currentSectionIndex,
            lockedSectionKeys: sessionDto.executionState?.lockedSectionKeys,
          });
          return;
        }

        // If backend resume is missing answers or throws, fallback to local storage
        throw new Error('No answers in backend resume');
      } catch (e) {
        if (!mounted) return;

        // Fallback to local storage
        try {
          const saved = localStorage.getItem(`${STORAGE_KEY}_${testId}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.answers && Object.keys(parsed.answers).length > 0 && typeof parsed.currentQuestionIndex === 'number') {
              restoreStateFromStorage(parsed);
            }
          }
        } catch (localErr) {
          console.error('Failed to resume assessment from local storage fallback', localErr);
        }
      } finally {
        if (mounted) {
          setAttemptedResume(true);
        }
      }
    };

    resume();

    return () => {
      mounted = false;
    };
  }, [testId, testInstance?.id, hasAttemptedResume]);
}
