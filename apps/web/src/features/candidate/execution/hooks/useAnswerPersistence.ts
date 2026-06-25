import { useEffect, useRef } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { executionService } from '../services/execution.service';

export function useAnswerPersistence(testId: string) {
  const { answers, connectionStatus, setAutosaveStatus } = useExecutionStore();
  const prevAnswersRef = useRef(answers);

  useEffect(() => {
    const currentAnswers = answers;
    const prevAnswers = prevAnswersRef.current;

    // We only want to persist the specifically changed answer.
    // By keeping a ref of the previous answers object, we can strictly compare references.
    let changedQuestionId: string | null = null;
    
    for (const questionId of Object.keys(currentAnswers)) {
      if (currentAnswers[questionId] !== prevAnswers[questionId]) {
        changedQuestionId = questionId;
        break; // Assume one answer changes at a time
      }
    }

    prevAnswersRef.current = currentAnswers;

    if (!changedQuestionId) return;

    const current = currentAnswers[changedQuestionId];

    // Format the answer for the backend DTO
    let answerString = '';
    if (current.selectedOptionId) {
      answerString = current.selectedOptionId;
    } else if (current.selectedOptionIds && current.selectedOptionIds.length > 0) {
      answerString = JSON.stringify(current.selectedOptionIds);
    } else if (current.textResponse) {
      answerString = current.textResponse;
    }

    const payload = {
      questionId: changedQuestionId,
      answer: answerString,
      // Defaulting timeSpent to 0 if not tracked natively yet
      timeSpentSeconds: 0,
      isMarkedForReview: current.status === 'MARKED_FOR_REVIEW',
    };

    if (connectionStatus === 'ONLINE') {
      setAutosaveStatus('SAVING');
      
      executionService
        .saveAnswer(testId, payload)
        .then(() => {
          setAutosaveStatus('SAVED');
        })
        .catch(() => {
          setAutosaveStatus('FAILED');
          // OfflineRecovery will catch this through its own listener or we queue it here
        });
    }
  }, [answers, testId, connectionStatus, setAutosaveStatus]);
}
