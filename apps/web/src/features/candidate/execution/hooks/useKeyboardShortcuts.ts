import { useEffect } from 'react';
import { useExecutionStore } from '../stores/execution.store';

interface KeyboardShortcutProps {
  onSubmit: () => void;
}

export function useKeyboardShortcuts({ onSubmit }: KeyboardShortcutProps) {
  const { goNext, goPrevious, toggleReview, currentQuestion } = useExecutionStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut if we are typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            goNext();
            break;
          case 'p':
            e.preventDefault();
            goPrevious();
            break;
          case 'm':
            e.preventDefault();
            if (currentQuestion) {
              toggleReview(currentQuestion.id);
            }
            break;
          case 's':
            e.preventDefault();
            onSubmit();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrevious, toggleReview, onSubmit, currentQuestion]);
}
