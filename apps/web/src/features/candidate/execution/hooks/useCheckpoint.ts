import { useEffect } from 'react';
import { executionService } from '../services/execution.service';
import { useExecutionStore } from '../stores/execution.store';

export function useCheckpoint(testInstanceId: string) {
  useEffect(() => {
    if (!testInstanceId) return;

    const interval = setInterval(() => {
      const state = useExecutionStore.getState();
      
      const payload = {
        currentSection: 'default',
        currentQuestion: state.currentQuestion?.id || '',
        currentQuestionIndex: state.currentQuestionIndex,
        remainingTime: state.remainingTime,
        markedQuestions: Object.values(state.answers)
          .filter(a => a.status === 'MARKED_FOR_REVIEW')
          .map(a => a.questionId),
        visitedQuestions: [], 
        autosavedAnswers: state.answers,
        networkStatusTimestamp: new Date().toISOString(),
      };

      executionService.checkpoint(testInstanceId, payload).catch(err => {
        console.error('Failed to save checkpoint', err);
      });
    }, 30000); // every 30 seconds

    return () => clearInterval(interval);
  }, [testInstanceId]);
}
