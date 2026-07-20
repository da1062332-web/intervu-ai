import { useEffect, useRef } from 'react';
import { useExecutionStore } from '../stores/execution.store';
import { executionService } from '../services/execution.service';
import { useOfflineRecovery } from './useOfflineRecovery';

export function useAnswerPersistence(testId: string) {
  const { answers, connectionStatus, setAutosaveStatus } = useExecutionStore();
  const { queueOperation } = useOfflineRecovery();
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
      testId,
      questionId: changedQuestionId,
      answer: answerString,
      timeSpentSeconds: 0,
      isMarkedForReview: current.status === 'MARKED_FOR_REVIEW',
    };

    if (connectionStatus === 'ONLINE') {
      setAutosaveStatus('SAVING');

      executionService
        .saveAnswer(testId, {
          questionId: payload.questionId,
          answer: payload.answer,
          timeSpentSeconds: payload.timeSpentSeconds,
          isMarkedForReview: payload.isMarkedForReview,
        })
        .then((response) => {
          setAutosaveStatus('SAVED');
          if (response?.status === 'EXPIRED_AND_SUBMITTED') {
            useExecutionStore.getState().setSubmissionStatus('SUBMITTING');
            window.location.href = `/candidate/tests/${testId}/summary`;
          }
        })
        .catch(() => {
          setAutosaveStatus('FAILED');
          // DATA-001: When online save fails, queue to IndexedDB for replay on reconnect
          queueOperation('SAVE_ANSWER', payload).catch((err) => {
            console.error('[AnswerPersistence] Failed to queue failed answer to offline store', err);
          });
        });
    } else {
      // DATA-001: Offline — queue the answer to IndexedDB immediately
      // It will be replayed and confirmed when connectivity is restored
      setAutosaveStatus('FAILED');
      queueOperation('SAVE_ANSWER', payload).catch((err) => {
        console.error('[AnswerPersistence] Failed to queue offline answer', err);
      });
    }
  }, [answers, testId, connectionStatus, setAutosaveStatus, queueOperation]);
}
