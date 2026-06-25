import { useEffect } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { executionService } from '../services/execution.service';

const STORAGE_KEY = 'intervu_execution_autosave';

export function useResume(testId: string | undefined) {
  const { restoreStateFromStorage, testInstance, setAttemptedResume } = useExecutionStore();

  useEffect(() => {
    let mounted = true;

    if (!testId || !testInstance) return;

    const resume = async () => {
      try {
        // Try backend resume first
        const sessionDto = await executionService.resumeAssessment(testId);
        
        if (!mounted) return;

        // Note: The backend resume / SessionDto would normally contain the answers array, 
        // but currently it just returns the generic object. If it has answers, we parse them:
        if (sessionDto && (sessionDto as any).answers) {
          const formattedAnswers = ((sessionDto as any).answers as any[]).reduce((acc: any, ans: any) => {
            let parsedOptionIds;
            try {
              parsedOptionIds = ans.answer.startsWith('[') ? JSON.parse(ans.answer) : undefined;
            } catch {
              // Not an array
            }

            acc[ans.questionId] = {
              status: ans.isMarkedForReview ? 'MARKED_FOR_REVIEW' : 'ANSWERED',
              selectedOptionId: !parsedOptionIds ? ans.answer : undefined,
              selectedOptionIds: parsedOptionIds,
              timeSpentSeconds: ans.timeSpentSeconds || 0,
            };
            return acc;
          }, {});

          restoreStateFromStorage({
            answers: formattedAnswers,
            currentQuestionIndex: sessionDto.currentQuestion || 0,
            remainingTime: (sessionDto as any).remainingTime ?? testInstance.durationSeconds,
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
            if (parsed.answers && typeof parsed.currentQuestionIndex === 'number') {
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
  }, [testId, testInstance, restoreStateFromStorage, setAttemptedResume]);
}
